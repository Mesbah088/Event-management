import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth/rbac';
import { ticketCancelSchema } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/utils/audit';
import { Registration } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(['ADMIN']);
    if (!auth.success) return auth.response;

    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const validated = ticketCancelSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'A cancellation reason is required.' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const registration = await db.collection<Registration>('registrations').findOne({ _id: new ObjectId(id) });

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });
    }

    if (registration.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Ticket is already cancelled.' }, { status: 400 });
    }

    const now = new Date();
    await db.collection('registrations').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'CANCELLED',
          cancelledAt: now,
          cancellationReason: validated.data.reason,
        },
      }
    );

    // If ticket was only ISSUED (not USED), decrement registered count to free up capacity
    if (registration.status === 'ISSUED') {
      await db.collection('events').updateOne(
        { _id: registration.eventId },
        { $inc: { registeredCount: -1 } }
      );
    }

    await logAuditEvent(
      db,
      { id: auth.user.id, email: auth.user.email },
      'TICKET_CANCEL',
      'registrations',
      id,
      {
        ticketRef: registration.ticketRef,
        previousStatus: registration.status,
        reason: validated.data.reason,
      }
    );

    return NextResponse.json({
      success: true,
      message: `Ticket ${registration.ticketRef} successfully cancelled.`,
    });
  } catch (error: any) {
    console.error('Ticket cancellation error:', error);
    return NextResponse.json({ error: 'Failed to cancel ticket.' }, { status: 500 });
  }
}
