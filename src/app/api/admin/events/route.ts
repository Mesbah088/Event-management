import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth/rbac';
import { eventSchema } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/utils/audit';
import { Event } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAuth(['ADMIN']);
    if (!auth.success) return auth.response;

    const db = await getDb();
    const events = await db.collection<Event>('events').find().sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      events: events.map(e => ({
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
        status: e.status,
        gates: e.gates,
        createdAt: e.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Admin events list error:', error);
    return NextResponse.json({ error: 'Failed to retrieve events.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(['ADMIN']);
    if (!auth.success) return auth.response;

    const body = await request.json().catch(() => ({}));
    const validated = eventSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Invalid event parameters.' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const existing = await db.collection<Event>('events').findOne({ slug: validated.data.slug });
    if (existing) {
      return NextResponse.json({ error: 'An event with this URL slug already exists.' }, { status: 409 });
    }

    const now = new Date();
    const newEvent: Event = {
      slug: validated.data.slug,
      title: validated.data.title,
      description: validated.data.description,
      organizer: validated.data.organizer,
      venue: validated.data.venue,
      startDate: new Date(validated.data.startDate),
      endDate: new Date(validated.data.endDate),
      registrationOpenAt: new Date(validated.data.registrationOpenAt),
      registrationCloseAt: new Date(validated.data.registrationCloseAt),
      capacity: validated.data.capacity,
      registeredCount: 0,
      status: validated.data.status,
      gates: validated.data.gates,
      ticketExpiryDate: validated.data.ticketExpiryDate ? new Date(validated.data.ticketExpiryDate) : undefined,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection('events').insertOne(newEvent);

    await logAuditEvent(
      db,
      { id: auth.user.id, email: auth.user.email },
      'EVENT_CREATE',
      'events',
      result.insertedId,
      { title: newEvent.title, slug: newEvent.slug }
    );

    return NextResponse.json({
      success: true,
      event: { id: result.insertedId.toString(), ...newEvent },
    });
  } catch (error: any) {
    console.error('Admin event creation error:', error);
    return NextResponse.json({ error: 'Failed to create event.' }, { status: 500 });
  }
}
