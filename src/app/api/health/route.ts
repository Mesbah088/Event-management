import { NextResponse } from 'next/server';
import { getDb, getMongoClient } from '@/lib/db/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await getMongoClient();
    const db = await getDb();

    const isConnectedToAtlas = !!client;
    const dbName = db.databaseName;
    const cols = await db.listCollections().toArray();
    const colNames = cols.map(c => c.name);

    const events = await db.collection('events').find({}).toArray();
    const eventSummaries = events.map(e => ({
      id: e._id?.toString(),
      slug: e.slug,
      title: e.title,
      status: e.status,
    }));

    const registrationsCount = await db.collection('registrations').countDocuments().catch(() => 0);
    const donationsCount = await db.collection('donations').countDocuments().catch(() => 0);

    return NextResponse.json({
      status: 'ok',
      connectedToAtlas: isConnectedToAtlas,
      databaseName: dbName,
      collections: colNames,
      events: eventSummaries,
      eventsCount: events.length,
      registrationsCount,
      donationsCount,
      envDbName: process.env.MONGODB_DB_NAME || 'not set',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error?.message || 'Database check failed',
      },
      { status: 500 }
    );
  }
}
