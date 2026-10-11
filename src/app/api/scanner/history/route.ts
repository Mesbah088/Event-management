import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth/rbac';
import { ScanLog } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(['SCANNER', 'ADMIN']);
    if (!auth.success) {
      return auth.response;
    }

    const { user } = auth;
    const db = await getDb();

    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10)));

    const logs = await db
      .collection<ScanLog>('scanLogs')
      .find({ scannerId: new ObjectId(user.id) })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    const formattedLogs = logs.map(l => ({
      id: l._id!.toString(),
      eventId: l.eventId.toString(),
      ticketRef: l.ticketRef || 'N/A',
      gateId: l.gateId,
      outcome: l.outcome,
      timestamp: l.timestamp,
      notes: l.notes,
    }));

    return NextResponse.json({ logs: formattedLogs });
  } catch (error: any) {
    console.error('Scanner history error:', error);
    return NextResponse.json({ error: 'Failed to retrieve scan history.' }, { status: 500 });
  }
}
