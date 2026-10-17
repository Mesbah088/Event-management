import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth/rbac';
import { hashTicketToken } from '@/lib/crypto/tokens';
import { checkInSchema } from '@/lib/validation/schemas';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { Registration, ScanLog, ScanOutcome, Event } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 1. Authorize Scanner or Admin
    const auth = await requireAuth(['SCANNER', 'ADMIN']);
    if (!auth.success) {
      return auth.response;
    }

    const { user } = auth;

    // Rate limiting per scanner to avoid burst floods (e.g., 60 scans per minute)
    const rateCheck = checkRateLimit(`scanner:${user.id}`, 60, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Scanner scan rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validated = checkInSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Invalid scan payload.' },
        { status: 400 }
      );
    }

    const { token, eventId, gateId } = validated.data;
    const eventObjectId = new ObjectId(eventId);
    const scannerObjectId = new ObjectId(user.id);

    // If scanner has assigned events, ensure they are authorized for this event
    if (user.role === 'SCANNER' && user.assignedEventIds && user.assignedEventIds.length > 0) {
      if (!user.assignedEventIds.includes(eventId)) {
        return NextResponse.json(
          { error: 'You are not authorized to scan tickets for this event.' },
          { status: 403 }
        );
      }
    }

    const db = await getDb();
    const event = await db.collection<Event>('events').findOne({ _id: eventObjectId });
    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    // Clean input and extract token or reference if URL was provided
    let cleanToken = token.trim();
    if (cleanToken.startsWith('http://') || cleanToken.startsWith('https://')) {
      try {
        const urlObj = new URL(cleanToken);
        const tokParam = urlObj.searchParams.get('token');
        const refParam = urlObj.searchParams.get('ticketRef') || urlObj.searchParams.get('ref');
        if (tokParam) cleanToken = tokParam;
        else if (refParam) cleanToken = refParam;
      } catch {}
    }

    // Hash the presented raw token
    const tokenHash = hashTicketToken(cleanToken);
    const upperRef = cleanToken.toUpperCase();
    const now = new Date();

    // 2. CRITICAL ATOMIC CONDITIONAL UPDATE:
    // Update the ticket from ISSUED to USED ONLY IF:
    // - (tokenHash matches OR ticketRef matches)
    // - eventId matches
    // - status is still 'ISSUED'
    const updateResult = await db.collection<Registration>('registrations').findOneAndUpdate(
      {
        eventId: eventObjectId,
        status: 'ISSUED',
        $or: [
          { tokenHash },
          { ticketRef: upperRef },
        ],
      },
      {
        $set: {
          status: 'USED',
          checkedInAt: now,
          checkedInBy: scannerObjectId,
          gateId: gateId || 'MAIN',
        },
      },
      {
        returnDocument: 'after',
      }
    );

    // Case A: Successful First Check-in
    if (updateResult) {
      const updatedDoc = updateResult;

      // Immutable scan log entry (NEVER stores raw token)
      const scanLog: ScanLog = {
        eventId: eventObjectId,
        scannerId: scannerObjectId,
        scannerName: user.name,
        gateId,
        ticketRef: updatedDoc.ticketRef,
        outcome: 'VALID',
        timestamp: now,
      };
      await db.collection('scanLogs').insertOne(scanLog);

      return NextResponse.json({
        success: true,
        outcome: 'VALID' as ScanOutcome,
        message: 'VALID — ENTRY ALLOWED',
        ticket: {
          ticketRef: updatedDoc.ticketRef,
          attendeeName: updatedDoc.attendeeName,
          attendeeEmail: updatedDoc.attendeeEmail,
          attendeePhone: updatedDoc.attendeePhone || updatedDoc.customFields?.phone,
          attendeeType: updatedDoc.attendeeType || updatedDoc.customFields?.attendeeType || 'NITER_STUDENT',
          batch: updatedDoc.batch || updatedDoc.customFields?.batch,
          studentId: updatedDoc.studentId || updatedDoc.customFields?.studentId,
          department: updatedDoc.department || updatedDoc.customFields?.department,
          institution: updatedDoc.institution || updatedDoc.customFields?.institution,
          trxId: updatedDoc.trxId || updatedDoc.customFields?.trxId,
          paymentMethod: updatedDoc.paymentMethod || updatedDoc.customFields?.paymentMethod,
          paymentStatus: updatedDoc.paymentStatus || (updatedDoc.trxId ? 'PAID' : undefined),
          checkedInAt: now,
          gateId,
        },
      });
    }

    // Case B: Atomic update did not match. Determine failure reason safely.
    // Query by tokenHash or ticketRef to identify specific reason without race vulnerability
    const existingRegistration = await db.collection<Registration>('registrations').findOne({
      $or: [
        { tokenHash },
        { ticketRef: upperRef },
      ],
    });

    let failureOutcome: ScanOutcome = 'INVALID';
    let failureMessage = 'INVALID — ENTRY DENIED (Unrecognized Ticket)';
    let diagnosticInfo: any = {};

    if (existingRegistration) {
      if (existingRegistration.eventId.toString() !== eventId) {
        failureOutcome = 'WRONG_EVENT';
        failureMessage = 'WRONG EVENT — ENTRY DENIED (Ticket belongs to another event)';
      } else if (existingRegistration.status === 'USED') {
        failureOutcome = 'DUPLICATE';
        failureMessage = 'DUPLICATE — ENTRY DENIED (Ticket Already Used)';
        diagnosticInfo = {
          initialCheckInAt: existingRegistration.checkedInAt,
          initialGateId: existingRegistration.gateId,
          attendeeName: existingRegistration.attendeeName,
          attendeeEmail: existingRegistration.attendeeEmail,
          attendeePhone: existingRegistration.attendeePhone || existingRegistration.customFields?.phone,
          attendeeType: existingRegistration.attendeeType || existingRegistration.customFields?.attendeeType,
          batch: existingRegistration.batch || existingRegistration.customFields?.batch,
          studentId: existingRegistration.studentId || existingRegistration.customFields?.studentId,
          department: existingRegistration.department || existingRegistration.customFields?.department,
          institution: existingRegistration.institution || existingRegistration.customFields?.institution,
          trxId: existingRegistration.trxId || existingRegistration.customFields?.trxId,
          paymentMethod: existingRegistration.paymentMethod || existingRegistration.customFields?.paymentMethod,
        };
      } else if (existingRegistration.status === 'CANCELLED') {
        failureOutcome = 'CANCELLED';
        failureMessage = 'CANCELLED — ENTRY DENIED (Ticket was cancelled)';
        diagnosticInfo = {
          cancellationReason: existingRegistration.cancellationReason,
        };
      }
    }

    // Record immutable audit scan log for the rejected attempt
    const failureLog: ScanLog = {
      eventId: eventObjectId,
      scannerId: scannerObjectId,
      scannerName: user.name,
      gateId,
      ticketRef: existingRegistration ? existingRegistration.ticketRef : undefined,
      outcome: failureOutcome,
      timestamp: now,
      notes: failureMessage,
    };
    await db.collection('scanLogs').insertOne(failureLog);

    return NextResponse.json(
      {
        success: false,
        outcome: failureOutcome,
        message: failureMessage,
        details: diagnosticInfo,
        ticketRef: existingRegistration?.ticketRef,
      },
      { status: failureOutcome === 'DUPLICATE' ? 409 : 400 }
    );
  } catch (error: any) {
    console.error('Check-in processing error:', error);
    return NextResponse.json(
      {
        error: 'Network or database error during check-in verification. Please re-check before entry.',
        outcome: 'UNKNOWN_RETRY_SAFELY',
      },
      { status: 500 }
    );
  }
}
