import { Resend } from 'resend';
import { Db, ObjectId } from 'mongodb';
import { generateTicketEmailHtml, generateTicketEmailText, TicketEmailProps } from './templates';
import { EmailLog } from '@/types';

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || 'University Events <onboarding@resend.dev>';

let resendClient: Resend | null = null;
if (resendApiKey && resendApiKey.startsWith('re_') && resendApiKey !== 're_123456789_placeholder') {
  resendClient = new Resend(resendApiKey);
}

export interface SendTicketEmailParams {
  db: Db;
  registrationId: ObjectId;
  eventId: ObjectId;
  recipientEmail: string;
  props: TicketEmailProps;
}

export async function sendTicketEmail(params: SendTicketEmailParams): Promise<{
  success: boolean;
  status: 'SENT' | 'FAILED' | 'DEV_MOCKED';
  messageId?: string;
  error?: string;
}> {
  const { db, registrationId, eventId, recipientEmail, props } = params;
  const now = new Date();

  // Check if Resend client is configured with a real API key
  if (!resendClient) {
    const mockMsgId = `mock_msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log(`[EMAIL DISPATCH - DEV/TEST ADAPTER] Ticket email simulated for ${recipientEmail}. Ticket Ref: ${props.ticketRef}`);

    const emailLog: EmailLog = {
      registrationId,
      eventId,
      recipientEmail,
      provider: 'mock',
      providerMessageId: mockMsgId,
      status: 'SUCCESS',
      attempts: 1,
      lastAttemptAt: now,
      sanitizedError: 'Sent via local/mock delivery adapter (RESEND_API_KEY not configured with live credentials).',
    };

    await db.collection('emailLogs').insertOne(emailLog);
    await db.collection('registrations').updateOne(
      { _id: registrationId },
      {
        $set: {
          emailStatus: 'DEV_MOCKED',
          emailLastAttemptAt: now,
          emailError: undefined,
        },
      }
    );

    return { success: true, status: 'DEV_MOCKED', messageId: mockMsgId };
  }

  // Real Resend delivery
  try {
    const htmlContent = generateTicketEmailHtml(props);
    const textContent = generateTicketEmailText(props);

    const { data, error } = await resendClient.emails.send({
      from: emailFrom,
      to: recipientEmail,
      subject: `Your Ticket for ${props.eventTitle} [${props.ticketRef}]`,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      const sanitizedError = error.message || 'Resend provider error';
      await recordEmailAttempt(db, registrationId, eventId, recipientEmail, false, undefined, sanitizedError);
      return { success: false, status: 'FAILED', error: sanitizedError };
    }

    const messageId = data?.id;
    await recordEmailAttempt(db, registrationId, eventId, recipientEmail, true, messageId);
    return { success: true, status: 'SENT', messageId };
  } catch (err: any) {
    const sanitizedError = err.message || 'Unexpected network error during email dispatch';
    await recordEmailAttempt(db, registrationId, eventId, recipientEmail, false, undefined, sanitizedError);
    return { success: false, status: 'FAILED', error: sanitizedError };
  }
}

async function recordEmailAttempt(
  db: Db,
  registrationId: ObjectId,
  eventId: ObjectId,
  recipientEmail: string,
  isSuccess: boolean,
  providerMessageId?: string,
  sanitizedError?: string
) {
  const now = new Date();
  const existingLog = await db.collection<EmailLog>('emailLogs').findOne({ registrationId });

  if (existingLog) {
    await db.collection('emailLogs').updateOne(
      { _id: existingLog._id },
      {
        $set: {
          status: isSuccess ? 'SUCCESS' : 'FAILED',
          providerMessageId: providerMessageId || existingLog.providerMessageId,
          lastAttemptAt: now,
          sanitizedError,
        },
        $inc: { attempts: 1 },
      }
    );
  } else {
    const newLog: EmailLog = {
      registrationId,
      eventId,
      recipientEmail,
      provider: 'resend',
      providerMessageId,
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      attempts: 1,
      lastAttemptAt: now,
      sanitizedError,
    };
    await db.collection('emailLogs').insertOne(newLog);
  }

  await db.collection('registrations').updateOne(
    { _id: registrationId },
    {
      $set: {
        emailStatus: isSuccess ? 'SENT' : 'FAILED',
        emailLastAttemptAt: now,
        emailError: sanitizedError,
      },
    }
  );
}
