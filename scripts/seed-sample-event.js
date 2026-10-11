const { MongoClient } = require('mongodb');

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/university_events';
  const dbName = process.env.MONGODB_DB_NAME || 'university_events';

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    const slug = 'hackathon-2026';
    const existing = await db.collection('events').findOne({ slug });

    if (existing) {
      console.log(`Sample event already exists with slug: ${slug} (ID: ${existing._id})`);
      process.exit(0);
    }

    const now = new Date();
    const event = {
      slug,
      title: 'Annual University Hackathon 2026',
      description: 'The flagship 24-hour innovation marathon bringing together students, developers, and designers to build solutions for campus life and sustainability.',
      organizer: 'Computer Science Society & Robotics Club',
      venue: 'Main Campus Grand Auditorium & Tech Hub Hall A',
      startDate: new Date(now.getTime() + 7 * 24 * 3600 * 1000), // In 7 days
      endDate: new Date(now.getTime() + 8 * 24 * 3600 * 1000),
      registrationOpenAt: new Date(now.getTime() - 24 * 3600 * 1000), // Opened yesterday
      registrationCloseAt: new Date(now.getTime() + 6 * 24 * 3600 * 1000), // Closes in 6 days
      capacity: 500,
      registeredCount: 0,
      status: 'PUBLISHED',
      gates: ['Main Gate A', 'East Gate B', 'VIP & Speaker Gate'],
      createdAt: now,
      updatedAt: now,
    };

    const res = await db.collection('events').insertOne(event);
    console.log(`✓ Sample event seeded successfully!`);
    console.log(`  Title: ${event.title}`);
    console.log(`  Slug: ${event.slug}`);
    console.log(`  ID: ${res.insertedId}`);
  } catch (err) {
    console.error('Failed to seed event:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
