import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth/rbac';
import { Event, Registration, ScanLog, EmailLog } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAuth(['ADMIN']);
    if (!auth.success) {
      return auth.response;
    }

    const db = await getDb();

    // Aggregated metrics
    const [
      totalRegistrations,
      checkedInCount,
      cancelledCount,
      issuedCount,
      duplicateScanAttempts,
      invalidScanAttempts,
      failedEmails,
      recentScans,
      activeEventsCount,
    ] = await Promise.all([
      db.collection<Registration>('registrations').countDocuments(),
      db.collection<Registration>('registrations').countDocuments({ status: 'USED' }),
      db.collection<Registration>('registrations').countDocuments({ status: 'CANCELLED' }),
      db.collection<Registration>('registrations').countDocuments({ status: 'ISSUED' }),
      db.collection<ScanLog>('scanLogs').countDocuments({ outcome: 'DUPLICATE' }),
      db.collection<ScanLog>('scanLogs').countDocuments({ outcome: { $in: ['INVALID', 'WRONG_EVENT'] } }),
      db.collection<EmailLog>('emailLogs').countDocuments({ status: 'FAILED' }),
      db
        .collection<ScanLog>('scanLogs')
        .find()
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray(),
      db.collection<Event>('events').countDocuments({ status: 'PUBLISHED' }),
    ]);

    const checkInRate = totalRegistrations > 0
      ? Math.round((checkedInCount / totalRegistrations) * 100)
      : 0;

    return NextResponse.json({
      metrics: {
        totalRegistrations,
        checkedInCount,
        cancelledCount,
        remainingAttendees: issuedCount,
        checkInRate,
        duplicateScanAttempts,
        invalidScanAttempts,
        failedEmails,
        activeEventsCount,
      },
      recentScans: recentScans.map(s => ({
        id: s._id!.toString(),
        scannerName: s.scannerName,
        gateId: s.gateId,
        outcome: s.outcome,
        ticketRef: s.ticketRef || 'N/A',
        timestamp: s.timestamp,
      })),
    });
  } catch (error: any) {
    console.error('Admin dashboard metrics error:', error);
    return NextResponse.json({ error: 'Failed to retrieve dashboard metrics.' }, { status: 500 });
  }
}
