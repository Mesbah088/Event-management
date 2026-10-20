import { NextResponse } from 'next/server';
import { getDb, getMongoClient } from '@/lib/db/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  let directError: string | null = null;
  let isConnectedToAtlas = false;
  let uriConfigured = false;
  let uriDomain = '';

  const rawUri = process.env.MONGODB_URI;
  if (rawUri) {
    uriConfigured = true;
    try {
      const match = rawUri.match(/@([^/?]+)/);
      uriDomain = match ? match[1] : 'present';
    } catch {
      uriDomain = 'unknown';
    }
  }

  try {
    const client = await getMongoClient();
    if (client) {
      isConnectedToAtlas = true;
    }
  } catch (err: any) {
    directError = err?.message || String(err);
  }

  // If getMongoClient returned null, try explicit connect to see the exact error
  if (!isConnectedToAtlas && !directError) {
    try {
      const { MongoClient } = await import('mongodb');
      const uri = rawUri || 'mongodb://mrmesbah273_db_user:0X5iTGsqU0qdykem@ac-h7l5xxe-shard-00-00.2q4yzvq.mongodb.net:27017,ac-h7l5xxe-shard-00-01.2q4yzvq.mongodb.net:27017,ac-h7l5xxe-shard-00-02.2q4yzvq.mongodb.net:27017/university_events?ssl=true&replicaSet=atlas-kd2mfm-shard-0&authSource=admin&retryWrites=true&w=majority';
      const testClient = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
      await testClient.connect();
      isConnectedToAtlas = true;
      await testClient.close();
    } catch (testErr: any) {
      directError = testErr?.message || String(testErr);
    }
  }

  try {
    const db = await getDb();
    const [eventsCount, registrationsCount, donationsCount] = await Promise.all([
      db.collection('events').countDocuments().catch(() => 0),
      db.collection('registrations').countDocuments().catch(() => 0),
      db.collection('donations').countDocuments().catch(() => 0),
    ]);

    return NextResponse.json({
      status: 'ok',
      connectedToAtlas: isConnectedToAtlas,
      uriConfiguredInVercel: uriConfigured,
      uriHost: uriDomain,
      connectionError: directError,
      database: 'university_events',
      metrics: {
        eventsCount,
        registrationsCount,
        donationsCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error?.message || 'Database check failed',
        connectionError: directError,
      },
      { status: 500 }
    );
  }
}
