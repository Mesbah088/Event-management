const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function bootstrap() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/university_events';
  const dbName = process.env.MONGODB_DB_NAME || 'university_events';

  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@university.edu').trim().toLowerCase();
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminSecurePassword2026!';
  const adminName = process.env.INITIAL_ADMIN_NAME || 'Super Administrator';

  console.log(`Checking Admin identity in database: ${dbName}...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    // Verify / build indexes first to ensure the unique partial index is active
    await db.collection('users').createIndex(
      { role: 1 },
      {
        unique: true,
        partialFilterExpression: { role: 'ADMIN', isActive: true },
        name: 'unique_active_admin_idx',
      }
    );

    // Check if an active Admin already exists
    const existingAdmin = await db.collection('users').findOne({ role: 'ADMIN', isActive: true });
    if (existingAdmin) {
      console.log(`[ABORT] An active Admin account already exists: ${existingAdmin.email} (ID: ${existingAdmin._id})`);
      console.log('For security, the bootstrap procedure will not create duplicate Admins.');
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const now = new Date();

    const adminUser = {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    // Atomic insertion. If another concurrent process tries to insert simultaneously,
    // the unique partial index on { role: 'ADMIN', isActive: true } will reject the second insertion!
    const result = await db.collection('users').insertOne(adminUser);
    console.log(`✓ Initial Admin successfully created!`);
    console.log(`  Name: ${adminName}`);
    console.log(`  Email: ${adminEmail}`);
    console.log(`  ID: ${result.insertedId}`);
    console.log(`  Created At: ${now.toISOString()}`);
    console.log('Please log in at /admin/login using the configured credentials.');
  } catch (err) {
    if (err.code === 11000) {
      console.error('[CONCURRENCY CONFLICT] Another process already created the Admin user.');
    } else {
      console.error('Bootstrap failed:', err);
    }
    process.exit(1);
  } finally {
    await client.close();
  }
}

bootstrap();
