const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/university_events';
  const dbName = process.env.MONGODB_DB_NAME || 'university_events';

  console.log(`Connecting to MongoDB at: ${uri.replace(/\/\/.*@/, '//<credentials>@')} [DB: ${dbName}]`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    console.log('Building indexes...');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex(
      { role: 1 },
      {
        unique: true,
        partialFilterExpression: { role: 'ADMIN', isActive: true },
        name: 'unique_active_admin_idx',
      }
    );

    await db.collection('events').createIndex({ slug: 1 }, { unique: true });
    await db.collection('events').createIndex({ status: 1, registrationOpenAt: 1, registrationCloseAt: 1 });

    await db.collection('registrations').createIndex(
      { eventId: 1, attendeeEmail: 1 },
      { unique: true, name: 'unique_event_attendee_email_idx' }
    );
    await db.collection('registrations').createIndex({ ticketRef: 1 }, { unique: true, name: 'unique_ticket_ref_idx' });
    await db.collection('registrations').createIndex({ tokenHash: 1 }, { unique: true, name: 'unique_token_hash_idx' });
    await db.collection('registrations').createIndex(
      { tokenHash: 1, eventId: 1, status: 1 },
      { name: 'atomic_checkin_lookup_idx' }
    );

    await db.collection('scanLogs').createIndex({ eventId: 1, timestamp: -1 });
    await db.collection('scanLogs').createIndex({ scannerId: 1, timestamp: -1 });
    await db.collection('scanLogs').createIndex({ outcome: 1 });

    await db.collection('emailLogs').createIndex({ registrationId: 1 });
    await db.collection('emailLogs').createIndex({ status: 1, attempts: 1 });

    await db.collection('auditLogs').createIndex({ targetId: 1, timestamp: -1 });
    await db.collection('auditLogs').createIndex({ actorId: 1, timestamp: -1 });

    console.log('✓ All indexes successfully created and verified.');
  } catch (err) {
    console.error('Error ensuring indexes:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
