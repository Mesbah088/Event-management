import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth/rbac';
import { Registration, Event } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(['ADMIN']);
    if (!auth.success) return auth.response;

    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.trim() || '';
    const eventId = url.searchParams.get('eventId')?.trim() || '';
    const status = url.searchParams.get('status')?.trim() || '';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const db = await getDb();
    const query: any = {};

    if (eventId && /^[0-9a-fA-F]{24}$/.test(eventId)) {
      query.eventId = new ObjectId(eventId);
    }

    if (status && ['ISSUED', 'USED', 'CANCELLED'].includes(status)) {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      query.$or = [
        { attendeeName: searchRegex },
        { attendeeEmail: searchRegex },
        { ticketRef: searchRegex },
      ];
    }

    const [total, registrations] = await Promise.all([
      db.collection<Registration>('registrations').countDocuments(query),
      db
        .collection<Registration>('registrations')
        .find(query)
        .sort({ registeredAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    // Fetch related event details for display
    const eventIds = [...new Set(registrations.map(r => r.eventId.toString()))];
    const events = await db
      .collection<Event>('events')
      .find({ _id: { $in: eventIds.map(id => new ObjectId(id)) } })
      .toArray();
    const eventMap = new Map(events.map(e => [e._id!.toString(), e.title]));

    const formatted = registrations.map(r => ({
      id: r._id!.toString(),
      eventId: r.eventId.toString(),
      eventTitle: eventMap.get(r.eventId.toString()) || 'Unknown Event',
      attendeeName: r.attendeeName,
      attendeeEmail: r.attendeeEmail,
      attendeePhone: r.attendeePhone || r.customFields?.phone,
      attendeeType: r.attendeeType || r.customFields?.attendeeType,
      batch: r.batch || r.customFields?.batch,
      studentId: r.studentId || r.customFields?.studentId,
      department: r.department || r.customFields?.department,
      institution: r.institution || r.customFields?.institution,
      customFields: r.customFields,
      ticketRef: r.ticketRef,
      status: r.status,
      registeredAt: r.registeredAt,
      checkedInAt: r.checkedInAt,
      checkedInBy: r.checkedInBy?.toString(),
      gateId: r.gateId,
      cancelledAt: r.cancelledAt,
      cancellationReason: r.cancellationReason,
      emailStatus: r.emailStatus,
      emailLastAttemptAt: r.emailLastAttemptAt,
      emailError: r.emailError,
    }));

    return NextResponse.json({
      registrations: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Admin registrations list error:', error);
    return NextResponse.json({ error: 'Failed to retrieve registrations.' }, { status: 500 });
  }
}
