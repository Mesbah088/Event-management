import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth/rbac';
import { ScanLog, Event } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(['ADMIN']);
    if (!auth.success) return auth.response;

    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId')?.trim();
    const outcome = url.searchParams.get('outcome')?.trim();
    const gateId = url.searchParams.get('gateId')?.trim();
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const db = await getDb();
    const query: any = {};

    if (eventId && /^[0-9a-fA-F]{24}$/.test(eventId)) {
      query.eventId = new ObjectId(eventId);
    }
    if (outcome) {
      query.outcome = outcome;
    }
    if (gateId) {
      query.gateId = gateId;
    }

    const [total, logs] = await Promise.all([
      db.collection<ScanLog>('scanLogs').countDocuments(query),
      db
        .collection<ScanLog>('scanLogs')
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    // Fetch related event titles
    const eventIds = [...new Set(logs.map(l => l.eventId.toString()))];
    const events = await db
      .collection<Event>('events')
      .find({ _id: { $in: eventIds.map(id => new ObjectId(id)) } })
      .toArray();
    const eventMap = new Map(events.map(e => [e._id!.toString(), e.title]));

    const formatted = logs.map(l => ({
      id: l._id!.toString(),
      eventId: l.eventId.toString(),
      eventTitle: eventMap.get(l.eventId.toString()) || 'Unknown Event',
      scannerId: l.scannerId.toString(),
      scannerName: l.scannerName,
      gateId: l.gateId,
      ticketRef: l.ticketRef || 'N/A',
      outcome: l.outcome,
      timestamp: l.timestamp,
      notes: l.notes,
    }));

    return NextResponse.json({
      logs: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Admin scan-logs error:', error);
    return NextResponse.json({ error: 'Failed to retrieve scan logs.' }, { status: 500 });
  }
}
