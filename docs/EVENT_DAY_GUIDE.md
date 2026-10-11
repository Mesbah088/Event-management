# University Event QR Code Entry Management System — Event-Day Operating Manual

## 1. Scanner Volunteer Instructions

### 1.1 Equipment & Setup
- Use a smartphone with modern Chrome (Android) or Safari (iOS).
- Ensure your phone has a stable Wi-Fi or LTE/5G connection.
- Enable camera permissions when prompted.
- Navigate to: `https://events.yourcampus.edu/scanner/login`
- Log in with the credentials provided by the Event Lead.
- Select your assigned Gate (e.g., "Main Gate", "East Wing", "VIP Gate").

### 1.2 Scanning Procedure
1. Hold the attendee's digital QR ticket within the scanner viewfinder rectangle.
2. The scanner decodes the QR code and requests verification from the central server.
3. Observe the screen status:
   - **GREEN ("VALID — ENTRY ALLOWED")**: 
     - Attendee's name and ticket reference appear.
     - Single pleasant audio chime plays.
     - Direct attendee to proceed.
   - **RED ("DUPLICATE — ENTRY DENIED")**: 
     - Shows the exact timestamp and gate where the ticket was previously checked in.
     - Audible double buzz plays.
     - **DO NOT ADMIT**. Direct the attendee to the Helpdesk.
   - **RED ("INVALID / CANCELLED")**: 
     - Ticket is either fake, corrupted, or administratively cancelled.
     - Do not admit.
   - **AMBER ("NETWORK ERROR / UNKNOWN RESULT")**:
     - Connection dropped during verification.
     - **DO NOT GUESS**. Click "Retry Verification" or type the Ticket Reference into the manual lookup.

### 1.3 Manual Fallback Mode
If an attendee's phone screen is cracked or too dim for the camera:
1. Tap the **"Manual Entry"** tab on the scanner interface.
2. Enter the human-readable Ticket Reference (e.g. `UE-2026-X7K2`) or raw token.
3. Tap **"Verify & Check-In"**.

---

## 2. Event Administrator Quick Reference

### 2.1 Live Entry Monitoring
- Access the Admin Dashboard at: `/admin`
- View live check-in percentage, total scanned count, remaining expected attendees, and gate throughput in real time.

### 2.2 Handling Gate Disputes
1. Open `/admin/registrations`.
2. Search by attendee name or email address.
3. Review ticket status:
   - If marked `USED`: check the `checkedInAt` timestamp and `checkedInBy` staff member to clarify who admitted the original ticket.
   - If ticket email bounced: click **"Resend Ticket Email"** or issue an on-screen QR verification.

### 2.3 Post-Event Attendance Export
1. Navigate to `/admin/reports`.
2. Click **"Export Attendance CSV"**.
3. The exported file contains:
   `Attendee Name, Email, Ticket Ref, Check-in Status, Timestamp, Gate, Scanner Staff`.
