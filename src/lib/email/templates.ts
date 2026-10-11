export interface TicketEmailProps {
  attendeeName: string;
  eventTitle: string;
  organizer: string;
  venue: string;
  startDateFormatted: string;
  ticketRef: string;
  qrDataUrl: string;
  ticketUrl: string;
}

export function generateTicketEmailHtml(props: TicketEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Event Ticket - ${escapeHtml(props.eventTitle)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; color: #111827; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #3730a3 0%, #4f46e5 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 32px 24px; text-align: center; }
    .ticket-card { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; margin: 20px 0; }
    .qr-container { background: #ffffff; display: inline-block; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0; }
    .ticket-ref { font-family: monospace; font-size: 20px; font-weight: 700; color: #4338ca; letter-spacing: 2px; }
    .details { text-align: left; margin: 24px 0; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
    .detail-label { color: #64748b; font-weight: 500; }
    .detail-val { color: #0f172a; font-weight: 600; text-align: right; }
    .warning-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0; text-align: left; font-size: 13px; color: #991b1b; }
    .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p>Official Event Registration</p>
      <h1>${escapeHtml(props.eventTitle)}</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-top: 0;">Hello <strong>${escapeHtml(props.attendeeName)}</strong>,</p>
      <p style="color: #4b5563; font-size: 14px;">Your registration is confirmed! Present the QR code below at the venue entrance scanner.</p>
      
      <div class="ticket-card">
        <div class="ticket-ref">${escapeHtml(props.ticketRef)}</div>
        <div class="qr-container">
          <img src="${props.qrDataUrl}" alt="Event Ticket QR Code" width="220" height="220" style="display: block;" />
        </div>
        <p style="font-size: 12px; color: #64748b; margin: 0;">Present this QR code on your mobile device or printed ticket.</p>
      </div>

      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Date & Time:</span>
          <span class="detail-val">${escapeHtml(props.startDateFormatted)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Venue:</span>
          <span class="detail-val">${escapeHtml(props.venue)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Organizer:</span>
          <span class="detail-val">${escapeHtml(props.organizer)}</span>
        </div>
      </div>

      <div class="warning-box">
        <strong>IMPORTANT: Single Check-in Rule</strong><br>
        Each ticket permits exactly <strong>ONE</strong> successful admission. If this QR code is scanned multiple times, all subsequent attempts will be permanently rejected by the security scanners. Do not share your ticket.
      </div>
    </div>
    <div class="footer">
      <p>Need assistance? Contact the organizer at ${escapeHtml(props.organizer)}.</p>
      <p>© ${new Date().getFullYear()} University Event Management System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateTicketEmailText(props: TicketEmailProps): string {
  return `
REGISTRATION CONFIRMED: ${props.eventTitle}
--------------------------------------------------
Hello ${props.attendeeName},

Your registration is confirmed.
Ticket Reference: ${props.ticketRef}

Event: ${props.eventTitle}
Date & Time: ${props.startDateFormatted}
Venue: ${props.venue}
Organizer: ${props.organizer}

IMPORTANT SINGLE ENTRY RULE:
Each ticket permits exactly ONE successful admission. If this QR code is scanned multiple times, all subsequent attempts will be permanently rejected.

View or download your digital QR ticket online:
${props.ticketUrl}
--------------------------------------------------
University Event Management System
  `.trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
