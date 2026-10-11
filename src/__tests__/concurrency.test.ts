import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId, Db } from 'mongodb';
import { ensureIndexes } from '@/lib/db/indexes';
import {
  generateTicketToken,
  hashTicketToken,
  generateTicketReference,
} from '@/lib/crypto/tokens';
import { Registration, ScanLog } from '@/types';

describe('Critical Invariant: Atomic Check-In Concurrency Suite', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test_university_events');
    await ensureIndexes(db);
  }, 60000);

  afterAll(async () => {
    if (client) await client.close();
    if (mongoServer) await mongoServer.stop();
  });

  it('guarantees SUCCESSFUL_CHECKINS_PER_TICKET <= 1 under 50 simultaneous concurrent scans', async () => {
    const eventId = new ObjectId();
    const rawToken = generateTicketToken();
    const tokenHash = hashTicketToken(rawToken);
    const ticketRef = generateTicketReference('CONC');

    // Seed issued registration
    const initialReg: Registration = {
      eventId,
      attendeeName: 'Alice Concurrency',
      attendeeEmail: 'alice@campus.edu',
      ticketRef,
      tokenHash,
      status: 'ISSUED',
      registeredAt: new Date(),
      emailStatus: 'SENT',
    };
    await db.collection('registrations').insertOne(initialReg);

    // Prepare 50 simultaneous concurrent check-in operations from 50 different simulated scanner devices
    const NUM_SCANNERS = 50;
    const scannerIds = Array.from({ length: NUM_SCANNERS }, () => new ObjectId());

    const checkInOperations = scannerIds.map(async (scannerId, index) => {
      const gateId = `Gate-${(index % 4) + 1}`;
      const now = new Date();

      // The exact atomic check-in execution implemented in route.ts:
      const updateResult = await db.collection<Registration>('registrations').findOneAndUpdate(
        {
          tokenHash,
          eventId,
          status: 'ISSUED',
        },
        {
          $set: {
            status: 'USED',
            checkedInAt: now,
            checkedInBy: scannerId,
            gateId,
          },
        },
        {
          returnDocument: 'after',
        }
      );

      if (updateResult) {
        // First check-in succeeded
        await db.collection('scanLogs').insertOne({
          eventId,
          scannerId,
          scannerName: `Scanner-${index}`,
          gateId,
          ticketRef,
          outcome: 'VALID',
          timestamp: now,
        });
        return { outcome: 'VALID', scannerId };
      } else {
        // Document was not updated; evaluate failure
        const existing = await db.collection<Registration>('registrations').findOne({ tokenHash });
        const outcome = existing?.status === 'USED' ? 'DUPLICATE' : 'INVALID';

        await db.collection('scanLogs').insertOne({
          eventId,
          scannerId,
          scannerName: `Scanner-${index}`,
          gateId,
          ticketRef,
          outcome,
          timestamp: now,
        });
        return { outcome, scannerId };
      }
    });

    // Fire all 50 requests simultaneously!
    const results = await Promise.all(checkInOperations);

    const validResults = results.filter((r) => r.outcome === 'VALID');
    const duplicateResults = results.filter((r) => r.outcome === 'DUPLICATE');

    // Verify invariants:
    // 1. Exactly ONE request succeeded
    expect(validResults).toHaveLength(1);

    // 2. Exactly 49 requests were rejected as DUPLICATE
    expect(duplicateResults).toHaveLength(NUM_SCANNERS - 1);

    // 3. Database state invariant: Ticket is in 'USED' state
    const finalDoc = await db.collection<Registration>('registrations').findOne({ tokenHash });
    expect(finalDoc).not.toBeNull();
    expect(finalDoc?.status).toBe('USED');
    expect(finalDoc?.checkedInAt).toBeDefined();
    expect(finalDoc?.checkedInBy).toBeDefined();

    // 4. Scan log invariant: Exactly 1 VALID entry exists
    const validLogsCount = await db.collection('scanLogs').countDocuments({
      ticketRef,
      outcome: 'VALID',
    });
    expect(validLogsCount).toBe(1);

    const duplicateLogsCount = await db.collection('scanLogs').countDocuments({
      ticketRef,
      outcome: 'DUPLICATE',
    });
    expect(duplicateLogsCount).toBe(NUM_SCANNERS - 1);
  });

  it('allows different tickets to be scanned concurrently by different scanners', async () => {
    const eventId = new ObjectId();
    const token1 = generateTicketToken();
    const token2 = generateTicketToken();

    await db.collection('registrations').insertMany([
      {
        eventId,
        attendeeName: 'Attendee 1',
        attendeeEmail: 'att1@campus.edu',
        ticketRef: generateTicketReference('T1'),
        tokenHash: hashTicketToken(token1),
        status: 'ISSUED',
        registeredAt: new Date(),
        emailStatus: 'SENT',
      },
      {
        eventId,
        attendeeName: 'Attendee 2',
        attendeeEmail: 'att2@campus.edu',
        ticketRef: generateTicketReference('T2'),
        tokenHash: hashTicketToken(token2),
        status: 'ISSUED',
        registeredAt: new Date(),
        emailStatus: 'SENT',
      },
    ]);

    const scannerA = new ObjectId();
    const scannerB = new ObjectId();

    const [res1, res2] = await Promise.all([
      db.collection<Registration>('registrations').findOneAndUpdate(
        { tokenHash: hashTicketToken(token1), eventId, status: 'ISSUED' },
        { $set: { status: 'USED', checkedInAt: new Date(), checkedInBy: scannerA, gateId: 'Gate-1' } },
        { returnDocument: 'after' }
      ),
      db.collection<Registration>('registrations').findOneAndUpdate(
        { tokenHash: hashTicketToken(token2), eventId, status: 'ISSUED' },
        { $set: { status: 'USED', checkedInAt: new Date(), checkedInBy: scannerB, gateId: 'Gate-2' } },
        { returnDocument: 'after' }
      ),
    ]);

    expect(res1).not.toBeNull();
    expect(res2).not.toBeNull();
    expect(res1?.status).toBe('USED');
    expect(res2?.status).toBe('USED');
  });

  it('rejects cancelled and invalid tokens', async () => {
    const eventId = new ObjectId();
    const cancelledToken = generateTicketToken();

    await db.collection('registrations').insertOne({
      eventId,
      attendeeName: 'Cancelled Attendee',
      attendeeEmail: 'cancelled@campus.edu',
      ticketRef: generateTicketReference('CAN'),
      tokenHash: hashTicketToken(cancelledToken),
      status: 'CANCELLED',
      registeredAt: new Date(),
      cancellationReason: 'Violated terms',
      emailStatus: 'SENT',
    });

    // Check-in on cancelled ticket
    const cancelledAttempt = await db.collection<Registration>('registrations').findOneAndUpdate(
      { tokenHash: hashTicketToken(cancelledToken), eventId, status: 'ISSUED' },
      { $set: { status: 'USED' } }
    );
    expect(cancelledAttempt).toBeNull();

    // Check-in on completely fake token
    const fakeToken = generateTicketToken();
    const fakeAttempt = await db.collection<Registration>('registrations').findOneAndUpdate(
      { tokenHash: hashTicketToken(fakeToken), eventId, status: 'ISSUED' },
      { $set: { status: 'USED' } }
    );
    expect(fakeAttempt).toBeNull();
  });
});
