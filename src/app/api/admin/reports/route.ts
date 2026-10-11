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
    const eventId = url.searchParams.get('eventId')?.trim();
    const format = url.searchParams.get('format')?.toLowerCase(); // 'json' or 'csv'

    const db = await getDb();
    const query: any = {};
    if (eventId && /^[0-9a-fA-F]{24}$/.test(eventId)) {
      query.eventId = new ObjectId(eventId);
    }

    const registrations = await db
      .collection<Registration>('registrations')
      .find(query)
      .sort({ registeredAt: -1 })
      .toArray();

    const events = await db.collection<Event>('events').find().toArray();
    const eventMap = new Map(events.map(e => [e._id!.toString(), e.title]));

    if (format === 'csv') {
      const headers = [
        'Ticket Reference',
        'Attendee Name',
        'Attendee Email',
        'Attendee Phone',
        'Event Title',
        'Ticket Status',
        'Registration Date',
        'Checked In Date',
        'Gate',
        'Email Status',
        'Cancellation Reason',
      ];

      const rows = registrations.map(r => [
        escapeCsv(r.ticketRef),
        escapeCsv(r.attendeeName),
        escapeCsv(r.attendeeEmail),
        escapeCsv(r.attendeePhone || ''),
        escapeCsv(eventMap.get(r.eventId.toString()) || 'Unknown Event'),
        escapeCsv(r.status),
        escapeCsv(r.registeredAt ? r.registeredAt.toISOString() : ''),
        escapeCsv(r.checkedInAt ? r.checkedInAt.toISOString() : ''),
        escapeCsv(r.gateId || ''),
        escapeCsv(r.emailStatus),
        escapeCsv(r.cancellationReason || ''),
      ]);

      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="attendance-report-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // Default JSON Summary
    const total = registrations.length;
    const checkedIn = registrations.filter(r => r.status === 'USED').length;
    const cancelled = registrations.filter(r => r.status === 'CANCELLED').length;
    const pending = registrations.filter(r => r.status === 'ISSUED').length;

    return NextResponse.json({
      summary: {
        total,
        checkedIn,
        cancelled,
        pending,
        checkInPercentage: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
      },
      count: total,
    });
  } catch (error: any) {
    console.error('Admin reports error:', error);
    return NextResponse.json({ error: 'Failed to generate report.' }, { status: 500 });
  }
}

function escapeCsv(val: any): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  // Prevent CSV injection (formula injection with =, +, -, @)
  if (/^[=+\-@]/.test(str)) {
    return `"'${str}"`;
  }
  return `"${str}"`;
}
