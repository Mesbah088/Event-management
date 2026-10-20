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

    const {
      name,
      email,
      phone,
      attendeeType = 'EXTERNAL_STUDENT',
      batch,
      studentId,
      department,
      institution,
      trxId,
      senderPhone,
      paymentAmount,
      paymentMethod,
    } = validated.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Validate external university requirements
    if (attendeeType === 'EXTERNAL_STUDENT') {
      if (!institution || !institution.trim()) {
        return NextResponse.json(
          { error: 'বিশ্ববিদ্যালয়ের নাম (University name) প্রদান করা আবশ্যক।' },
          { status: 400 }
        );
      }
      if (!trxId || !trxId.trim()) {
        return NextResponse.json(
          { error: 'রেজিস্ট্রেশনের জন্য রেজিস্ট্রেশন ফি ৪৯৯ টাকা পরিশোধ ও Transaction ID (TrxID) প্রদান করা বাধ্যতামূলক।' },
          { status: 400 }
        );
      }
      if (!senderPhone || !senderPhone.trim()) {
        return NextResponse.json(
          { error: 'যে নম্বর থেকে বিকাশ বা নগদ করা হয়েছে সেই প্রেরক নম্বরটি (Sender Phone) প্রদান করা আবশ্যক।' },
          { status: 400 }
        );
      }
      const amount = Number(paymentAmount);
      if (!paymentAmount || isNaN(amount) || amount < 499) {
        return NextResponse.json(
          { error: 'নির্ধারিত রেজিস্ট্রেশন ফি ৪৯৯ টাকা পরিশোধ করা বাধ্যতামূলক।' },
          { status: 400 }
        );
      }
    }

    const db = await getDb();

    // Prevent duplicate TrxID usage across registrations
    if (attendeeType === 'EXTERNAL_STUDENT' && trxId) {
      const cleanTrx = trxId.trim().toUpperCase();
      const existingTrxRegistration = await db.collection<Registration>('registrations').findOne({
        trxId: cleanTrx,
      });
      if (existingTrxRegistration) {
        return NextResponse.json(
          { error: 'এই Transaction ID (TrxID) দিয়ে ইতোমধ্যে রেজিস্ট্রেশন সম্পন্ন করা হয়েছে। অনুগ্রহ করে নতুন পেমেন্ট সম্পন্ন করে সঠিক TrxID দিন।' },
          { status: 409 }
        );
      }
    }

    // Query event
    let query: any = { slug: id };
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { slug: id }] };
    }

    let event = await db.collection<Event>('events').findOne(query);
    if (!event) {
      event = await db.collection<Event>('events').findOne({ slug: 'niter-islamic-conference-2026' });
    }
    if (!event) {
      event = await db.collection<Event>('events').findOne({ status: 'PUBLISHED' });
    }
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
    const ticketRef = generateTicketReference('NIS');

    // Create registration document
    const newRegistration: Registration = {
      eventId: event._id!,
      attendeeName: name.trim(),
      attendeeEmail: normalizedEmail,
      attendeePhone: phone ? phone.trim() : undefined,
      attendeeType: attendeeType || 'EXTERNAL_STUDENT',
      batch: batch ? batch.trim() : undefined,
      studentId: studentId ? studentId.trim() : undefined,
      department: department ? department.trim() : undefined,
      institution: institution ? institution.trim() : (attendeeType === 'NITER_STUDENT' ? 'NITER' : undefined),
      trxId: trxId ? trxId.trim().toUpperCase() : undefined,
      senderPhone: senderPhone ? senderPhone.trim() : undefined,
      paymentAmount: attendeeType === 'EXTERNAL_STUDENT' ? (paymentAmount ? paymentAmount.trim() : '499') : (paymentAmount ? paymentAmount.trim() : undefined),
      paymentMethod: (paymentMethod as any) || (trxId ? 'bKash' : undefined),
      paymentStatus: attendeeType === 'EXTERNAL_STUDENT' ? 'PAID' : (trxId ? 'PAID' : 'FREE'),
      customFields: {
        attendeeType: attendeeType || 'EXTERNAL_STUDENT',
        ...(phone ? { phone: phone.trim() } : {}),
        ...(batch ? { batch: batch.trim() } : {}),
        ...(studentId ? { studentId: studentId.trim() } : {}),
        ...(department ? { department: department.trim() } : {}),
        ...(institution ? { institution: institution.trim() } : {}),
        ...(trxId ? { trxId: trxId.trim().toUpperCase() } : {}),
        ...(senderPhone ? { senderPhone: senderPhone.trim() } : {}),
        ...(attendeeType === 'EXTERNAL_STUDENT' ? { paymentAmount: paymentAmount ? paymentAmount.trim() : '499' } : (paymentAmount ? { paymentAmount: paymentAmount.trim() } : {})),
        ...(paymentMethod ? { paymentMethod } : {}),
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

    const appUrl =
      process.env.APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://event-management-beta-beige.vercel.app');
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

    // Optional: Sync payment record to donations collection for financial ledger
    if (trxId) {
      db.collection('donations').insertOne({
        donorName: name.trim(),
        donorUniversity: institution ? institution.trim() : (attendeeType === 'NITER_STUDENT' ? 'NITER' : 'External'),
        donorBatch: batch ? batch.trim() : '',
        donorPhone: senderPhone ? senderPhone.trim() : (phone ? phone.trim() : ''),
        amount: attendeeType === 'EXTERNAL_STUDENT' ? (paymentAmount ? Number(paymentAmount) || 499 : 499) : (paymentAmount ? (Number(paymentAmount) || paymentAmount) : 'Registration Fee'),
        trxId: trxId.trim().toUpperCase(),
        reference: `${name.trim()}_${institution ? institution.trim() : 'External'}_${batch ? batch.trim() : ''}`.replace(/\s+/g, '_'),
        paymentMethod: paymentMethod || 'bKash',
        eventSlug: event.slug,
        ticketRef,
        status: 'SUBMITTED',
        createdAt: now,
      }).catch(err => console.error('Donation record sync err:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Your ticket has been generated.',
      ticket: {
        ticketRef,
        attendeeName: name.trim(),
        attendeeEmail: normalizedEmail,
        attendeePhone: phone ? phone.trim() : '',
        attendeeType: attendeeType || 'EXTERNAL_STUDENT',
        batch: batch ? batch.trim() : '',
        studentId: studentId ? studentId.trim() : '',
        department: department ? department.trim() : '',
        institution: institution ? institution.trim() : (attendeeType === 'NITER_STUDENT' ? 'NITER' : ''),
        trxId: trxId ? trxId.trim().toUpperCase() : '',
        paymentAmount: attendeeType === 'EXTERNAL_STUDENT' ? (paymentAmount ? paymentAmount.trim() : '499') : (paymentAmount ? paymentAmount.trim() : ''),
        paymentMethod: paymentMethod || (trxId ? 'bKash' : ''),
        paymentStatus: attendeeType === 'EXTERNAL_STUDENT' ? 'PAID' : (trxId ? 'PAID' : 'FREE'),
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
