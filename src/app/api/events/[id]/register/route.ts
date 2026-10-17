import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { registrationSchema } from '@/lib/validation/schemas';
import {
  generateTicketToken,
  hashTicketToken,
  encryptTicketToken,
  generateTicketReference,
  generateQrDataUrl,
} from '@/lib/crypto/tokens';
import { sendTicketEmail } from '@/lib/email/resend';
import { checkRateLimit, getClientIp } from '@/lib/utils/rate-limit';
import { Event, Registration } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const ip = getClientIp(request);

    // Rate limiting: max 10 registrations per IP per minute
    const rateCheck = checkRateLimit(`register:${ip}`, 10, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many registration requests. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validated = registrationSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Invalid registration information.' },
        { status: 400 }
      );
    }

    const { name, email, phone, studentId, department } = validated.data;
    const normalizedEmail = email.trim().toLowerCase();

    const db = await getDb();

    // Query event
    let query: any = { slug: id };
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { slug: id }] };
    }

    const event = await db.collection<Event>('events').findOne(query);
    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    // Check event status
    if (event.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Registration is not currently available for this event.' }, { status: 400 });
    }

    // Check time window
    const now = new Date();
    if (now < new Date(event.registrationOpenAt)) {
      return NextResponse.json({ error: 'Registration has not opened yet for this event.' }, { status: 400 });
    }
    if (now > new Date(event.registrationCloseAt)) {
      return NextResponse.json({ error: 'Registration for this event has closed.' }, { status: 400 });
    }

    // Check if attendee is already registered prior to capacity reservation
    const existingRegistration = await db.collection<Registration>('registrations').findOne({
      eventId: event._id,
      attendeeEmail: normalizedEmail,
    });
    if (existingRegistration) {
      return NextResponse.json(
        { error: 'This email address is already registered for this event.' },
        { status: 409 }
      );
    }

    // Concurrency-safe capacity reservation:
    // Atomically increments registeredCount ONLY IF registeredCount < capacity
    const capacityReserveResult = await db.collection<Event>('events').findOneAndUpdate(
      {
        _id: event._id,
        status: 'PUBLISHED',
        registeredCount: { $lt: event.capacity },
      },
      {
        $inc: { registeredCount: 1 },
      },
      {
        returnDocument: 'after',
      }
    );

    if (!capacityReserveResult) {
      return NextResponse.json(
        { error: 'Event has reached maximum capacity. No more seats available.' },
        { status: 409 }
      );
    }

    // Generate cryptographic credentials
    const rawToken = generateTicketToken();
    const tokenHash = hashTicketToken(rawToken);
    const ticketRef = generateTicketReference('UE');

    // Create registration document
    const newRegistration: Registration = {
      eventId: event._id!,
      attendeeName: name.trim(),
      attendeeEmail: normalizedEmail,
      attendeePhone: phone ? phone.trim() : undefined,
      customFields: {
        ...(studentId ? { studentId: studentId.trim() } : {}),
        ...(department ? { department: department.trim() } : {}),
      },
      ticketRef,
      tokenHash,
      encryptedToken: encryptTicketToken(rawToken),
      status: 'ISSUED',
      registeredAt: now,
      emailStatus: 'PENDING',
    };

    let registrationId: ObjectId;

    try {
      const insertResult = await db.collection('registrations').insertOne(newRegistration);
      registrationId = insertResult.insertedId;
    } catch (insertError: any) {
      // Revert capacity reservation if insert failed
      await db.collection('events').updateOne(
        { _id: event._id },
        { $inc: { registeredCount: -1 } }
      );

      if (insertError.code === 11000) {
        return NextResponse.json(
          { error: 'This email address is already registered for this event.' },
          { status: 409 }
        );
      }
      throw insertError;
    }

    // Generate QR Code data URL
    const qrDataUrl = await generateQrDataUrl(rawToken);

    // Format start date for email and response
    const startDateFormatted = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Dhaka',
    }).format(new Date(event.startDate));

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const ticketUrl = `${appUrl}/events/${event.slug}/success?ticketRef=${encodeURIComponent(ticketRef)}`;

    // Dispatch confirmation email
    sendTicketEmail({
      db,
      registrationId,
      eventId: event._id!,
      recipientEmail: normalizedEmail,
      props: {
        attendeeName: name.trim(),
        eventTitle: event.title,
        organizer: event.organizer,
        venue: event.venue,
        startDateFormatted,
        ticketRef,
        qrDataUrl,
        ticketUrl,
      },
    }).catch(emailErr => {
      console.error('Background email dispatch error:', emailErr);
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Your ticket has been generated.',
      ticket: {
        ticketRef,
        attendeeName: name.trim(),
        attendeeEmail: normalizedEmail,
        rawToken, // Provided once on success screen for instant display & wallet download
        qrDataUrl,
        eventTitle: event.title,
        venue: event.venue,
        startDate: event.startDate,
        startDateFormatted,
        organizer: event.organizer,
        ticketUrl,
      },
    });
  } catch (error: any) {
    console.error('Registration processing error:', error);
    return NextResponse.json({ error: 'Failed to process registration.' }, { status: 500 });
  }
}
