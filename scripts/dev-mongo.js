const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Starting local development MongoDB engine...');

  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'university_events',
    },
  });

  const uri = mongod.getUri();
  console.log(`✓ Development MongoDB is running at: ${uri}`);

  // Auto-provision indexes and seed sample event and default admin for smooth immediate testing
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('university_events');

    console.log('Configuring indexes...');
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
    await db.collection('registrations').createIndex(
      { eventId: 1, attendeeEmail: 1 },
      { unique: true, name: 'unique_event_attendee_email_idx' }
    );
    await db.collection('registrations').createIndex({ ticketRef: 1 }, { unique: true });
    await db.collection('registrations').createIndex({ tokenHash: 1 }, { unique: true });
    await db.collection('registrations').createIndex({ tokenHash: 1, eventId: 1, status: 1 });

    // Seed default Admin
    const adminExists = await db.collection('users').findOne({ role: 'ADMIN', isActive: true });
    if (!adminExists) {
      const passwordHash = await bcrypt.hash('Admin1234!', 12);
      const now = new Date();
      await db.collection('users').insertOne({
        name: 'System Administrator',
        email: 'admin@university.edu',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      console.log('✓ Seeded Administrator: admin@university.edu (Password: Admin1234!)');
    }

    // Seed default Scanner
    const scannerExists = await db.collection('users').findOne({ email: 'scanner@university.edu' });
    if (!scannerExists) {
      const passwordHash = await bcrypt.hash('Scanner1234!', 12);
      const now = new Date();
      await db.collection('users').insertOne({
        name: 'Gate 1 Volunteer',
        email: 'scanner@university.edu',
        passwordHash,
        role: 'SCANNER',
        isActive: true,
        defaultGate: 'Main Gate A',
        createdAt: now,
        updatedAt: now,
      });
      console.log('✓ Seeded Gate Scanner: scanner@university.edu (Password: Scanner1234!)');
    }

    // Seed Sample Event
    const eventExists = await db.collection('events').findOne({ slug: 'niter-islamic-conference-2026' });
    if (!eventExists) {
      const now = new Date();
      const event = {
        slug: 'niter-islamic-conference-2026',
        title: 'NITER ISLAMIC Conference 2026',
        description: 'The premier campus gathering for Islamic knowledge, ethics, leadership, and youth empowerment. Organized at NITER with respected scholars, keynote talks, interactive Q&A sessions, and communal luncheon.',
        organizer: 'NITER Islamic Society',
        venue: 'NITER Central Auditorium & Campus Complex, Nayarhat, Savar, Dhaka',
        startDate: new Date(now.getTime() + 5 * 24 * 3600 * 1000),
        endDate: new Date(now.getTime() + 6 * 24 * 3600 * 1000),
        registrationOpenAt: new Date(now.getTime() - 24 * 3600 * 1000),
        registrationCloseAt: new Date(now.getTime() + 4 * 24 * 3600 * 1000),
        capacity: 1500,
        registeredCount: 0,
        status: 'PUBLISHED',
        gates: ['Main Auditorium Gate', 'East Academic Gate', 'VIP & Guest Gate'],
        createdAt: now,
        updatedAt: now,
      };
      await db.collection('events').insertOne(event);
      console.log('✓ Seeded Event: NITER ISLAMIC Conference 2026 (/events/niter-islamic-conference-2026)');
    }

    await client.close();
    console.log('\n[READY] MongoDB is listening on port 27017. Database is seeded and ready for Next.js app.');
  } catch (err) {
    console.error('Seed setup warning:', err);
  }

  // Handle process shutdown
  process.on('SIGINT', async () => {
    console.log('Stopping local MongoDB...');
    await mongod.stop();
    process.exit(0);
  });
}

main();
