import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth/rbac';
import { EmailLog, Registration } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(['ADMIN']);
    if (!auth.success) return auth.response;

    const url = new URL(request.url);
    const status = url.searchParams.get('status')?.trim();
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const db = await getDb();
    const query: any = {};

    if (status) {
      query.status = status;
    }

    const [total, logs] = await Promise.all([
      db.collection<EmailLog>('emailLogs').countDocuments(query),
      db
        .collection<EmailLog>('emailLogs')
        .find(query)
        .sort({ lastAttemptAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    // Fetch related registration ticketRefs
    const regIds = logs.map(l => l.registrationId);
    const registrations = await db
      .collection<Registration>('registrations')
      .find({ _id: { $in: regIds } })
      .toArray();
    const regMap = new Map(registrations.map(r => [r._id!.toString(), r.ticketRef]));

    const formatted = logs.map(l => ({
      id: l._id!.toString(),
      registrationId: l.registrationId.toString(),
      ticketRef: regMap.get(l.registrationId.toString()) || 'N/A',
      recipientEmail: l.recipientEmail,
      provider: l.provider,
      providerMessageId: l.providerMessageId || 'N/A',
      status: l.status,
      attempts: l.attempts,
      lastAttemptAt: l.lastAttemptAt,
      sanitizedError: l.sanitizedError,
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
    console.error('Admin email logs error:', error);
    return NextResponse.json({ error: 'Failed to retrieve email logs.' }, { status: 500 });
  }
}
