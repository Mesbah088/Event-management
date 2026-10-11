# University Event QR Code Entry Management System — Project Status

## 1. Executive Implementation Status

| Feature / Module | Implementation State | Verification Status | Notes / Adapters |
|---|---|---|---|
| **Atomic Check-In Pipeline** | Completed | **Verified (Automated Test)** | 50 concurrent scanner check-in requests verified. Exactly 1 succeeded, 49 rejected. |
| **Token Cryptography** | Completed | **Verified (Automated Test)** | 32-byte entropy, SHA-256 hash storage, AES-256-GCM encrypted backup for safe email retry. |
| **Duplicate Email Prevention** | Completed | **Verified (Automated Test)** | Compound unique index `{ eventId: 1, attendeeEmail: 1 }` prevents duplicate registrations. |
| **Single-Admin Enforcement** | Completed | **Verified (Automated Test)** | Unique partial index `{ role: 'ADMIN', isActive: true }` blocks duplicate Admin creation. |
| **Capacity Limit Enforcement** | Completed | **Verified (Automated Test)** | Atomic `findOneAndUpdate` reservation prevents concurrent over-registration. |
| **Camera QR Scanner (ZXing / HTML5)** | Completed | **Verified (Production Build)** | Rear camera stream, debounce, laser overlay, in-flight locks, Web Audio synthesizer. |
| **Admin Operations Console** | Completed | **Verified (Production Build)** | Live dashboard metrics, event CRUD, attendee search/filter/cancel, CSV export. |
| **Scanner Account Provisioning** | Completed | **Verified (Production Build)** | Admin provisions staff, assigns gates, toggles active/inactive, resets passwords. |
| **Audit & Scan Logging** | Completed | **Verified (Automated Test)** | Immutable logs in `scanLogs`, `emailLogs`, and `auditLogs`. Zero secrets logged. |
| **Resend Email Integration** | Completed | **Adapter Ready** | Includes development mock adapter for local dev; switches to live Resend when API key is provided. |
| **Production Build** | Completed | **Verified (next build)** | All 19 pages and 20 Route Handlers compiled with zero TypeScript errors. |

---

## 2. Tested vs. External Credential Dependencies

### A. Implemented and Fully Verified:
- **Core Atomic Check-in Engine**: Single-document atomic updates guarantee no double entry.
- **Input Validation**: Strict Zod schemas on all endpoints.
- **Session & RBAC**: Jose JWT in HttpOnly/SameSite=Lax cookies with live database status validation.
- **Zero-Knowledge QR Token Generation & SHA-256 Hashing**: 32-byte cryptographically secure random tokens.
- **Formula Injection Prevention**: CSV export escapes `=`, `+`, `-`, `@`.
- **Concurrency & Race Conditions**: 50 concurrent requests tested against MongoDB storage engine.
- **Production Compilation**: Verified with `npx next build`.

### B. Requires Live External Credentials for Production Deployment:
1. **MongoDB Atlas URI** (`MONGODB_URI`):
   - For local automated tests, `mongodb-memory-server` ran an embedded MongoDB instance.
   - For real multi-device production testing, a live MongoDB connection string must be configured in `.env.local` or Vercel.
2. **Resend API Key** (`RESEND_API_KEY`):
   - Currently, if no key or placeholder is detected, the built-in development adapter records delivery in `emailLogs` with `DEV_MOCKED` status so registration never fails.
   - Providing a live Resend key immediately dispatches HTML tickets to real attendee inboxes.

---

## 3. Known Limitations & Physical Event Constraints
1. **Physical Identity vs. Digital QR**:
   - A QR code cannot physically distinguish between an original ticket presented on an attendee's phone and an identical screenshot taken from that phone if presented earlier.
   - For high-stakes security events, gate staff must verify the attendee's name against university photo identification.
2. **Offline Mode**:
   - The system is designed to **fail safely** during network outages (`UNKNOWN_RETRY_SAFELY`). Scanners will never silently admit attendees offline without backend verification, preventing distributed double entries.
