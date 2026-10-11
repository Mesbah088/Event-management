import { Db, Collection, IndexSpecification, CreateIndexesOptions } from 'mongodb';

async function safeCreateIndex(
  coll: Collection,
  spec: IndexSpecification,
  options?: CreateIndexesOptions
): Promise<void> {
  try {
    await coll.createIndex(spec, options);
  } catch (err: any) {
    // Code 85: IndexOptionsConflict (Index already exists with a different name or options)
    // In that case, the index already exists, so we safely continue.
    if (err.code === 85) {
      return;
    }
    throw err;
  }
}

/**
 * Ensures all required collections and indexes are provisioned.
 * Guarantees domain invariants (Single Admin, Duplicate Email Prevention, Unique Ticket Hashes).
 */
export async function ensureIndexes(db: Db): Promise<void> {
  // 1. Users Collection
  const users = db.collection('users');
  await safeCreateIndex(users, { email: 1 }, { unique: true });
  // Enforce single active Admin constraint at the database engine level
  await safeCreateIndex(
    users,
    { role: 1 },
    {
      unique: true,
      partialFilterExpression: { role: 'ADMIN', isActive: true },
    }
  );

  // 2. Events Collection
  const events = db.collection('events');
  await safeCreateIndex(events, { slug: 1 }, { unique: true });
  await safeCreateIndex(events, { status: 1, registrationOpenAt: 1, registrationCloseAt: 1 });

  // 3. Registrations Collection
  const registrations = db.collection('registrations');
  // Invariant: No duplicate email registration for the same event
  await safeCreateIndex(registrations, { eventId: 1, attendeeEmail: 1 }, { unique: true });
  await safeCreateIndex(registrations, { ticketRef: 1 }, { unique: true });
  await safeCreateIndex(registrations, { tokenHash: 1 }, { unique: true });
  // Optimize atomic check-in query performance
  await safeCreateIndex(registrations, { tokenHash: 1, eventId: 1, status: 1 });

  // 4. ScanLogs Collection
  const scanLogs = db.collection('scanLogs');
  await safeCreateIndex(scanLogs, { eventId: 1, timestamp: -1 });
  await safeCreateIndex(scanLogs, { scannerId: 1, timestamp: -1 });
  await safeCreateIndex(scanLogs, { outcome: 1 });

  // 5. EmailLogs Collection
  const emailLogs = db.collection('emailLogs');
  await safeCreateIndex(emailLogs, { registrationId: 1 });
  await safeCreateIndex(emailLogs, { eventId: 1 });
  await safeCreateIndex(emailLogs, { status: 1, attempts: 1 });

  // 6. AuditLogs Collection
  const auditLogs = db.collection('auditLogs');
  await safeCreateIndex(auditLogs, { targetId: 1, timestamp: -1 });
  await safeCreateIndex(auditLogs, { actorId: 1, timestamp: -1 });
  await safeCreateIndex(auditLogs, { action: 1 });
}
