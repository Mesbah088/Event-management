import { NextResponse } from 'next/server';
import { getDb, getMongoClient } from '@/lib/db/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await getMongoClient();
    const db = await getDb();
    const isConnectedToAtlas = !!client;

    const [eventsCount, registrationsCount, donationsCount] = await Promise.all([
      db.collection('events').countDocuments().catch(() => 0),
      db.collection('registrations').countDocuments().catch(() => 0),
      db.collection('donations').countDocuments().catch(() => 0),
    ]);

    return NextResponse.json({
      status: 'ok',
      connectedToAtlas: isConnectedToAtlas,
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
      },
      { status: 500 }
    );
  }
}
