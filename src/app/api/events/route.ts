import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { Event } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const events = await db
      .collection<Event>('events')
      .find({ status: { $in: ['PUBLISHED', 'CLOSED'] } })
      .sort({ startDate: 1 })
      .toArray();

    const formattedEvents = events.map(e => ({
      id: e._id!.toString(),
      slug: e.slug,
      title: e.title,
      description: e.description,
      organizer: e.organizer,
      venue: e.venue,
      startDate: e.startDate,
      endDate: e.endDate,
      registrationOpenAt: e.registrationOpenAt,
      registrationCloseAt: e.registrationCloseAt,
      capacity: e.capacity,
      registeredCount: e.registeredCount || 0,
      remainingSeats: Math.max(0, e.capacity - (e.registeredCount || 0)),
      status: e.status,
      gates: e.gates,
    }));

    return NextResponse.json({ events: formattedEvents });
  } catch (error: any) {
    console.error('Events list error:', error);
    return NextResponse.json({ error: 'Failed to retrieve events.' }, { status: 500 });
  }
}
