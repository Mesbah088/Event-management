const { MongoClient } = require('mongodb');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/university_events';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const dbName = process.env.MONGODB_DB_NAME || 'university_events';
    const db = client.db(dbName);
    const now = new Date();

    const slug = 'niter-islamic-conference-2026';
    const eventData = {
      slug,
      title: 'NITER ISLAMIC Conference 2026',
      description: 'The premier campus gathering for Islamic knowledge, ethics, leadership, and youth empowerment. Organized at NITER with respected scholars, keynote talks, interactive Q&A sessions, and communal luncheon.',
      organizer: 'NITER Islamic Society',
      venue: 'NITER Central Auditorium & Campus Complex, Nayarhat, Savar, Dhaka',
      startDate: new Date(now.getTime() + 5 * 24 * 3600 * 1000), // In 5 days
      endDate: new Date(now.getTime() + 6 * 24 * 3600 * 1000),
      registrationOpenAt: new Date(now.getTime() - 24 * 3600 * 1000), // Open now
      registrationCloseAt: new Date(now.getTime() + 4 * 24 * 3600 * 1000), // Closes in 4 days
      capacity: 1500,
      registeredCount: 0,
      status: 'PUBLISHED',
      gates: ['Main Auditorium Gate', 'East Academic Gate', 'VIP & Guest Gate'],
      createdAt: now,
      updatedAt: now,
    };

    // Upsert the event
    await db.collection('events').updateOne(
      { slug },
      { $set: eventData },
      { upsert: true }
    );

    console.log('✓ Successfully created/updated event: NITER ISLAMIC Conference 2026');
    console.log(`  Slug: ${slug}`);
    console.log(`  Venue: ${eventData.venue}`);
    console.log(`  Capacity: ${eventData.capacity}`);

    const allEvents = await db.collection('events').find().toArray();
    console.log('\nAll Active Events in Database:');
    allEvents.forEach((e) => {
      console.log(`- ${e.title} (Slug: ${e.slug})`);
    });
  } catch (err) {
    console.error('Error seeding NITER event:', err);
  } finally {
    await client.close();
  }
}

run();
