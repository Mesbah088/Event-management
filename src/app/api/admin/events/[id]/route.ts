import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth/rbac';
import { logAuditEvent } from '@/lib/utils/audit';
import { Event } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(['ADMIN']);
    if (!auth.success) return auth.response;

    const { id } = params;
    const db = await getDb();
    const event = await db.collection<Event>('events').findOne({ _id: new ObjectId(id) });

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

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
        status: event.status,
        gates: event.gates,
        createdAt: event.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Admin get event error:', error);
    return NextResponse.json({ error: 'Failed to retrieve event.' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(['ADMIN']);
    if (!auth.success) return auth.response;

    const { id } = params;
    const body = await request.json().catch(() => ({}));

    const updateFields: any = { updatedAt: new Date() };
    if (body.title) updateFields.title = body.title.trim();
    if (body.description) updateFields.description = body.description.trim();
    if (body.venue) updateFields.venue = body.venue.trim();
    if (body.organizer) updateFields.organizer = body.organizer.trim();
    if (body.status) updateFields.status = body.status;
    if (body.capacity) updateFields.capacity = parseInt(body.capacity, 10);
    if (body.gates && Array.isArray(body.gates)) updateFields.gates = body.gates;
    if (body.startDate) updateFields.startDate = new Date(body.startDate);
    if (body.endDate) updateFields.endDate = new Date(body.endDate);
    if (body.registrationOpenAt) updateFields.registrationOpenAt = new Date(body.registrationOpenAt);
    if (body.registrationCloseAt) updateFields.registrationCloseAt = new Date(body.registrationCloseAt);

    const db = await getDb();
    const result = await db.collection('events').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    await logAuditEvent(
      db,
      { id: auth.user.id, email: auth.user.email },
      'EVENT_UPDATE',
      'events',
      id,
      updateFields
    );

    return NextResponse.json({ success: true, message: 'Event successfully updated.' });
  } catch (error: any) {
    console.error('Admin event update error:', error);
    return NextResponse.json({ error: 'Failed to update event.' }, { status: 500 });
  }
}
