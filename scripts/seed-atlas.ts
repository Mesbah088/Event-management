import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { ensureIndexes } from '../src/lib/db/indexes';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'university_events';

if (!uri) {
  console.error('Error: MONGODB_URI environment variable is required.');
  process.exit(1);
}

async function seed() {
  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB Atlas!');
    const db = client.db(dbName);

    // 1. Ensure all indexes
    console.log('Provisioning database indexes...');
    await ensureIndexes(db);
    console.log('✓ Indexes verified.');

    const now = new Date();

    // 2. Seed Default Event
    const eventSlug = 'niter-islamic-conference-2026';
    let event = await db.collection('events').findOne({ slug: eventSlug });
    if (!event) {
      console.log('Seeding default event: NITER ISLAMIC Conference 2026...');
      const eventDoc = {
        _id: new ObjectId('661a00000000000000000010'),
        slug: eventSlug,
        title: 'NITER ISLAMIC Conference 2026',
        description:
          'The premier campus gathering for Islamic knowledge, ethics, leadership, and youth empowerment. Organized at NITER with respected scholars, keynote talks, interactive Q&A sessions, and communal luncheon.',
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
      await db.collection('events').insertOne(eventDoc);
      console.log('✓ Default event seeded successfully!');
      event = eventDoc;
    } else {
      console.log('Default event already exists:', event.title);
    }

    // 3. Seed Users
    const adminEmail = 'admin@university.edu';
    const existingAdmin = await db.collection('users').findOne({ email: adminEmail });
    if (!existingAdmin) {
      console.log('Seeding default Administrator account...');
      const adminPassHash = await bcrypt.hash('Admin1234!', 10);
      await db.collection('users').insertOne({
        _id: new ObjectId('661a00000000000000000001'),
        name: 'System Administrator',
        email: adminEmail,
        passwordHash: adminPassHash,
        role: 'ADMIN',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      console.log('✓ Admin account seeded: admin@university.edu / Admin1234!');
    } else {
      console.log('Admin account already exists.');
    }

    const scannerEmail = 'scanner@university.edu';
    const existingScanner = await db.collection('users').findOne({ email: scannerEmail });
    if (!existingScanner) {
      console.log('Seeding default Gate Scanner Staff account...');
      const scannerPassHash = await bcrypt.hash('Scanner1234!', 10);
      await db.collection('users').insertOne({
        _id: new ObjectId('661a00000000000000000002'),
        name: 'Gate Scanner Staff',
        email: scannerEmail,
        passwordHash: scannerPassHash,
        role: 'SCANNER',
        isActive: true,
        defaultGate: 'Main Auditorium Gate',
        assignedEventIds: [event._id],
        createdAt: now,
        updatedAt: now,
      });
      console.log('✓ Scanner staff seeded: scanner@university.edu / Scanner1234!');
    } else {
      console.log('Scanner account already exists.');
    }

    console.log('\n=======================================');
    console.log('🎉 MongoDB Atlas initialization complete!');
    console.log('=======================================');
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
