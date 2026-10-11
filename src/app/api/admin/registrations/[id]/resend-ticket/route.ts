import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth/rbac';
import { decryptTicketToken, generateQrDataUrl } from '@/lib/crypto/tokens';
import { sendTicketEmail } from '@/lib/email/resend';
import { logAuditEvent } from '@/lib/utils/audit';
import { Registration, Event } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(['ADMIN']);
    if (!auth.success) return auth.response;

    const { id } = params;
    const db = await getDb();
    const registration = await db.collection<Registration>('registrations').findOne({ _id: new ObjectId(id) });

    if (!registration) {
      return NextResponse.json({ error: 'Registration record not found.' }, { status: 404 });
    }

    if (registration.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot resend tickets for a cancelled registration.' }, { status: 400 });
    }

    const event = await db.collection<Event>('events').findOne({ _id: registration.eventId });
    if (!event) {
      return NextResponse.json({ error: 'Associated event not found.' }, { status: 404 });
    }

    if (!registration.encryptedToken) {
      return NextResponse.json(
        { error: 'Ticket secret is unavailable for re-transmission. Attendee must present their issued ticket reference.' },
        { status: 400 }
      );
    }

    const rawToken = decryptTicketToken(registration.encryptedToken);
    if (!rawToken) {
      return NextResponse.json({ error: 'Unable to decrypt ticket secret for re-sending.' }, { status: 500 });
    }

    const qrDataUrl = await generateQrDataUrl(rawToken);
    const startDateFormatted = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(new Date(event.startDate));

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const ticketUrl = `${appUrl}/events/${event.slug}/success?ticketRef=${encodeURIComponent(registration.ticketRef)}`;

    const emailResult = await sendTicketEmail({
      db,
      registrationId: registration._id!,
      eventId: event._id!,
      recipientEmail: registration.attendeeEmail,
      props: {
        attendeeName: registration.attendeeName,
        eventTitle: event.title,
        organizer: event.organizer,
        venue: event.venue,
        startDateFormatted,
        ticketRef: registration.ticketRef,
        qrDataUrl,
        ticketUrl,
      },
    });

    await logAuditEvent(
      db,
      { id: auth.user.id, email: auth.user.email },
      'EMAIL_RESEND',
      'registrations',
      id,
      {
        ticketRef: registration.ticketRef,
        recipientEmail: registration.attendeeEmail,
        status: emailResult.status,
      }
    );

    return NextResponse.json({
      success: emailResult.success,
      status: emailResult.status,
      message: emailResult.success
        ? `Ticket email successfully resent to ${registration.attendeeEmail}.`
        : `Email delivery attempt recorded with error: ${emailResult.error}`,
    });
  } catch (error: any) {
    console.error('Ticket email resend error:', error);
    return NextResponse.json({ error: 'Failed to process ticket email resend.' }, { status: 500 });
  }
}
