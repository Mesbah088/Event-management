import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth/rbac';
import { Event } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAuth(['SCANNER', 'ADMIN']);
    if (!auth.success) {
      return auth.response;
    }

    const { user } = auth;
    const db = await getDb();

    let query: any = { status: { $in: ['PUBLISHED', 'CLOSED'] } };
    if (user.role === 'SCANNER' && user.assignedEventIds && user.assignedEventIds.length > 0) {
      query._id = { $in: user.assignedEventIds.map(id => new ObjectId(id)) };
    }

    const events = await db.collection<Event>('events').find(query).sort({ startDate: 1 }).toArray();

    return NextResponse.json({
      events: events.map(e => ({
        id: e._id!.toString(),
        slug: e.slug,
        title: e.title,
        venue: e.venue,
        startDate: e.startDate,
        gates: e.gates && e.gates.length > 0 ? e.gates : ['Main Entrance'],
        defaultGate: user.defaultGate || e.gates?.[0] || 'Main Entrance',
      })),
    });
  } catch (error: any) {
    console.error('Scanner events lookup error:', error);
    return NextResponse.json({ error: 'Failed to retrieve assigned events.' }, { status: 500 });
  }
}
