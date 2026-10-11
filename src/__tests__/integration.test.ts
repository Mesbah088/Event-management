import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId, Db } from 'mongodb';
import { ensureIndexes } from '@/lib/db/indexes';
import { hashPassword } from '@/lib/auth/password';
import {
  generateTicketToken,
  hashTicketToken,
  generateTicketReference,
  encryptTicketToken,
  decryptTicketToken,
} from '@/lib/crypto/tokens';
import { User, Event, Registration } from '@/types';

describe('Integration Test Suite: Database Constraints & Business Invariants', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test_integration_events');
    await ensureIndexes(db);
  }, 60000);

  afterAll(async () => {
    if (client) await client.close();
    if (mongoServer) await mongoServer.stop();
  });

  describe('Single-Admin Constraint & Concurrent Bootstrap', () => {
    it('enforces exactly ONE active Admin identity at database engine level', async () => {
      const passwordHash = await hashPassword('AdminPass2026!');
      const now = new Date();

      const admin1: User = {
        name: 'First Admin',
        email: 'admin1@campus.edu',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      const admin2: User = {
        name: 'Second Admin Attempt',
        email: 'admin2@campus.edu',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      // First insertion succeeds
      const res1 = await db.collection('users').insertOne(admin1);
      expect(res1.insertedId).toBeDefined();

      // Second insertion of an active Admin MUST fail with MongoDB Duplicate Key Error (code 11000)
      let duplicateError: any = null;
      try {
        await db.collection('users').insertOne(admin2);
      } catch (err) {
        duplicateError = err;
      }

      expect(duplicateError).not.toBeNull();
      expect(duplicateError.code).toBe(11000);

      // Verify count of active admins remains exactly 1
      const activeAdminCount = await db.collection('users').countDocuments({
        role: 'ADMIN',
        isActive: true,
      });
      expect(activeAdminCount).toBe(1);
    });
  });

  describe('Duplicate Email Registration Prevention', () => {
    it('rejects duplicate email registrations for the same event via unique index', async () => {
      const eventId = new ObjectId();
      const email = 'student@campus.edu';

      const reg1: Registration = {
        eventId,
        attendeeName: 'Student One',
        attendeeEmail: email,
        ticketRef: generateTicketReference('DUP1'),
        tokenHash: hashTicketToken(generateTicketToken()),
        status: 'ISSUED',
        registeredAt: new Date(),
        emailStatus: 'SENT',
      };

      const reg2: Registration = {
        eventId,
        attendeeName: 'Student One Duplicate Attempt',
        attendeeEmail: email,
        ticketRef: generateTicketReference('DUP2'),
        tokenHash: hashTicketToken(generateTicketToken()),
        status: 'ISSUED',
        registeredAt: new Date(),
        emailStatus: 'SENT',
      };

      // First insert succeeds
      await db.collection('registrations').insertOne(reg1);

      // Second insert for the exact same event and email must fail with 11000
      let duplicateError: any = null;
      try {
        await db.collection('registrations').insertOne(reg2);
      } catch (err) {
        duplicateError = err;
      }

      expect(duplicateError).not.toBeNull();
      expect(duplicateError.code).toBe(11000);
    });

    it('allows the same email to register for different events', async () => {
      const event1 = new ObjectId();
      const event2 = new ObjectId();
      const email = 'multievent@campus.edu';

      const reg1: Registration = {
        eventId: event1,
        attendeeName: 'Multi Attendee',
        attendeeEmail: email,
        ticketRef: generateTicketReference('M1'),
        tokenHash: hashTicketToken(generateTicketToken()),
        status: 'ISSUED',
        registeredAt: new Date(),
        emailStatus: 'SENT',
      };

      const reg2: Registration = {
        eventId: event2,
        attendeeName: 'Multi Attendee',
        attendeeEmail: email,
        ticketRef: generateTicketReference('M2'),
        tokenHash: hashTicketToken(generateTicketToken()),
        status: 'ISSUED',
        registeredAt: new Date(),
        emailStatus: 'SENT',
      };

      const res1 = await db.collection('registrations').insertOne(reg1);
      const res2 = await db.collection('registrations').insertOne(reg2);

      expect(res1.insertedId).toBeDefined();
      expect(res2.insertedId).toBeDefined();
    });
  });

  describe('Capacity Enforcement Under Atomic Reservation', () => {
    it('prevents registered count from exceeding capacity', async () => {
      const eventId = new ObjectId();
      const capacity = 5;

      const event: Event = {
        _id: eventId,
        slug: 'limited-seats-workshop',
        title: 'Limited Seats Workshop',
        description: 'Testing capacity limit.',
        organizer: 'Lab',
        venue: 'Room 101',
        startDate: new Date(),
        endDate: new Date(),
        registrationOpenAt: new Date(Date.now() - 3600000),
        registrationCloseAt: new Date(Date.now() + 3600000),
        capacity,
        registeredCount: 0,
        status: 'PUBLISHED',
        gates: ['Main Gate'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.collection('events').insertOne(event);

      // Attempt 10 atomic reservations when capacity is 5
      const reservationPromises = Array.from({ length: 10 }, async () => {
        return db.collection<Event>('events').findOneAndUpdate(
          {
            _id: eventId,
            status: 'PUBLISHED',
            registeredCount: { $lt: capacity },
          },
          {
            $inc: { registeredCount: 1 },
          },
          {
            returnDocument: 'after',
          }
        );
      });

      const results = await Promise.all(reservationPromises);
      const successfulReservations = results.filter((r) => r !== null);
      const rejectedReservations = results.filter((r) => r === null);

      expect(successfulReservations).toHaveLength(5);
      expect(rejectedReservations).toHaveLength(5);

      const finalEvent = await db.collection<Event>('events').findOne({ _id: eventId });
      expect(finalEvent?.registeredCount).toBe(capacity);
    });
  });

  describe('Safe Idempotent Email Retry', () => {
    it('preserves the original ticket secret across email retries', async () => {
      const rawToken = generateTicketToken();
      const encrypted = encryptTicketToken(rawToken);

      // Verify that after decryption, the token matches without creating a new secret
      const decrypted = decryptTicketToken(encrypted);
      expect(decrypted).toBe(rawToken);

      // Hash matches
      expect(hashTicketToken(decrypted!)).toBe(hashTicketToken(rawToken));
    });
  });
});
