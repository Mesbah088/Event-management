# University Event QR Code Entry Management System — Technical Design

## 1. System Architecture Overview
The system follows a modern full-stack serverless architecture built on Next.js 14 App Router, deployed on Vercel, paired with a cloud-hosted MongoDB Atlas database and Resend transactional email API.

```
                      +-----------------------------------+
                      |      Next.js 14 App Router        |
                      |   (Vercel Edge / Node.js Engine)  |
                      +-----------------+-----------------+
                                        |
               +------------------------+------------------------+
               |                        |                        |
     [Public Attendee]         [Scanner Volunteers]           [Admin]
    - Landing & Details        - Mobile Camera Stream     - Event CRUD & Stats
    - Registration Form        - Audio/Haptic Feedback    - Attendee CSV Export
    - Digital Ticket View      - Debounced Submissions    - Scanner Management
    - Resend Email Dispatch    - In-Flight Check-in Lock  - Audit & Scan Logs
               |                        |                        |
               +------------------------+------------------------+
                                        |
                                        v
                      +-----------------------------------+
                      |     Server Route Handlers & Zod   |
                      |   - JWT HttpOnly Authentication   |
                      |   - Rate Limiting Middleware      |
                      |   - Cryptographic Token Engine    |
                      +-----------------+-----------------+
                                        |
                                        v
                      +-----------------------------------+
                      |       MongoDB Atlas Cluster       |
                      |  - Connection Pooling Singleton   |
                      |  - Compound & Unique Indexes      |
                      |  - Atomic findOneAndUpdate()      |
                      +-----------------------------------+
```

---

## 2. Data Models & Schemas

### 2.1 Collection: `users`
Represents Admins and Scanner staff.
```typescript
interface User {
  _id: ObjectId;
  name: string;
  email: string; // normalized lowercase
  passwordHash: string; // bcrypt salt=12
  role: 'ADMIN' | 'SCANNER';
  isActive: boolean;
  assignedEventIds?: ObjectId[]; // For scanners: restricts check-ins to specific events
  defaultGate?: string; // e.g. "Main Entrance", "VIP Gate"
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}
```
**Indexes**:
- Unique index on `email` (`{ email: 1 }, { unique: true }`)
- Partial unique index on `role` for `ADMIN`:
  `db.users.createIndex({ role: 1 }, { unique: true, partialFilterExpression: { role: 'ADMIN', isActive: true } })`
  *Enforces the invariant: Exactly one active Admin account in the database.*

### 2.2 Collection: `events`
Represents university events, workshops, or club seminars.
```typescript
interface Event {
  _id: ObjectId;
  slug: string; // URL-safe slug e.g. "hackathon-2026"
  title: string;
  description: string;
  organizer: string;
  venue: string;
  startDate: Date;
  endDate: Date;
  registrationOpenAt: Date;
  registrationCloseAt: Date;
  capacity: number; // Maximum allowed attendees
  registeredCount: number; // Atomically tracked count
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
  gates: string[]; // List of gates, e.g. ["Gate A", "Gate B", "Auditorium Main"]
  ticketExpiryDate?: Date; // Optional explicit expiration
  createdAt: Date;
  updatedAt: Date;
}
```
**Indexes**:
- Unique index on `slug`
- Index on `{ status: 1, registrationOpenAt: 1, registrationCloseAt: 1 }`

### 2.3 Collection: `registrations`
Stores attendee registrations and ticket validation tokens.
```typescript
interface Registration {
  _id: ObjectId;
  eventId: ObjectId;
  attendeeName: string;
  attendeeEmail: string; // normalized lowercase
  attendeePhone?: string;
  customFields?: Record<string, string>; // e.g. studentId, department
  ticketRef: string; // Human-friendly code: e.g. "UE-2026-A8K9"
  tokenHash: string; // SHA-256 hex digest of the 32-byte raw token
  status: 'ISSUED' | 'USED' | 'CANCELLED';
  registeredAt: Date;
  checkedInAt?: Date;
  checkedInBy?: ObjectId; // User ID of scanner
  gateId?: string; // Gate used for entry
  cancelledAt?: Date;
  cancellationReason?: string;
  emailStatus: 'PENDING' | 'SENT' | 'FAILED';
  emailLastAttemptAt?: Date;
  emailError?: string;
}
```
**Indexes**:
- Compound Unique Index: `{ eventId: 1, attendeeEmail: 1 }` (Prevents duplicate email registration per event)
- Unique Index: `{ ticketRef: 1 }`
- Unique Index: `{ tokenHash: 1 }`
- Compound Query Index: `{ tokenHash: 1, eventId: 1, status: 1 }` (Optimizes atomic check-in)

### 2.4 Collection: `scanLogs`
Audit trail of every scan attempt across all gates.
```typescript
interface ScanLog {
  _id: ObjectId;
  eventId: ObjectId;
  scannerId: ObjectId;
  scannerName: string;
  gateId: string;
  ticketRef?: string; // Captured if known, redacted if invalid
  outcome: 'VALID' | 'DUPLICATE' | 'INVALID' | 'CANCELLED' | 'EXPIRED' | 'WRONG_EVENT';
  timestamp: Date;
  clientIp?: string;
  userAgent?: string;
  notes?: string;
}
```

### 2.5 Collection: `emailLogs`
Durable delivery tracking for tickets.
```typescript
interface EmailLog {
  _id: ObjectId;
  registrationId: ObjectId;
  eventId: ObjectId;
  recipientEmail: string;
  provider: 'resend';
  providerMessageId?: string;
  status: 'SUCCESS' | 'FAILED' | 'QUEUED';
  attempts: number;
  lastAttemptAt: Date;
  sanitizedError?: string;
}
```

### 2.6 Collection: `auditLogs`
Tracks administrative operations (event modifications, ticket cancellations, scanner account status changes).
```typescript
interface AuditLog {
  _id: ObjectId;
  actorId: ObjectId;
  actorEmail: string;
  action: 'EVENT_UPDATE' | 'TICKET_CANCEL' | 'SCANNER_STATUS_CHANGE' | 'EMAIL_RESEND' | 'ADMIN_BOOTSTRAP';
  targetCollection: string;
  targetId: ObjectId;
  changes?: Record<string, any>;
  timestamp: Date;
}
```

---

## 3. Atomic Check-In Execution Pipeline
The check-in operation is implemented as a single conditional atomic update:

```typescript
const result = await db.collection('registrations').findOneAndUpdate(
  {
    tokenHash: sha256(rawToken),
    eventId: new ObjectId(eventId),
    status: 'ISSUED'
  },
  {
    $set: {
      status: 'USED',
      checkedInAt: new Date(),
      checkedInBy: new ObjectId(scannerUser._id),
      gateId: gateId || 'MAIN'
    }
  },
  {
    returnDocument: 'after'
  }
);
```

### Failure Analysis Path
If `result.value` is `null`:
1. Query `{ tokenHash: sha256(rawToken) }`:
   - If document exists with `status === 'USED'`: return `DUPLICATE` (along with `checkedInAt` and `gateId` to provide context).
   - If document exists with `status === 'CANCELLED'`: return `CANCELLED`.
   - If document exists with `eventId !== scannerEventId`: return `WRONG_EVENT`.
2. If document does not exist: return `INVALID`.

**In all outcomes, an immutable record is inserted into `scanLogs`.**

---

## 4. Cryptographic QR Token Pipeline
1. **Generation**: `crypto.randomBytes(32).toString('base64url')` provides 256 bits of high-entropy randomness.
2. **Hashing**: `crypto.createHash('sha256').update(rawToken).digest('hex')` is stored in the database.
3. **QR Payload**: A compact JSON string `{"r":"UNI-2026-X8Y1","t":"<rawToken>"}` or a verification URL `https://domain.com/v/<rawToken>`.
4. **Security Property**: Even a full database leak reveals only SHA-256 hashes, preventing attackers from generating valid QR codes.
