import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { Event } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = await getDb();

    let query: any = { slug: id };
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { slug: id }] };
    }

    const event = await db.collection<Event>('events').findOne(query);

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    const now = new Date();
    const isRegistrationOpen =
      event.status === 'PUBLISHED' &&
      now >= new Date(event.registrationOpenAt) &&
      now <= new Date(event.registrationCloseAt) &&
      (event.registeredCount || 0) < event.capacity;

    return NextResponse.json({
      event: {
        id: event._id!.toString(),
        slug: event.slug,
        title: event.title,
        description: event.description,
        organizer: event.organizer,
        venue: event.venue,
        startDate: event.startDate,
        endDate: event.endDate,
        registrationOpenAt: event.registrationOpenAt,
        registrationCloseAt: event.registrationCloseAt,
        capacity: event.capacity,
        registeredCount: event.registeredCount || 0,
        remainingSeats: Math.max(0, event.capacity - (event.registeredCount || 0)),
        status: event.status,
        gates: event.gates,
        isRegistrationOpen,
      },
    });
  } catch (error: any) {
    console.error('Event details error:', error);
    return NextResponse.json({ error: 'Failed to retrieve event.' }, { status: 500 });
  }
}
