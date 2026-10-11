# 🎟️ NITER ISLAMIC Conference 2026 — QR Entry Management System

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Vitest](https://img.shields.io/badge/Vitest-23_Passed-FCC72B?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMesbah088%2FEvent-management)

An enterprise-grade, high-throughput web application engineered for **NITER ISLAMIC Conference 2026** (National Institute of Textile Engineering and Research). Designed for 500–2,000 attendees with instant cryptographic QR ticket issuance, mobile camera gate scanners, and a strict **Single-Checkin Atomic Database Guarantee**.

---

## 🌟 Key Features

### 👤 1. Attendee Registration & Digital QR Pass
- **Seamless Registration**: Form validated server-side with Zod and automatic email normalization (`toLowerCase()`).
- **Duplicate Prevention**: Compound unique database index `{ eventId: 1, attendeeEmail: 1 }` prevents multiple registrations for the same person.
- **Instant Digital QR Ticket**: High-resolution QR code pass with human-friendly reference (e.g. `UE-2026-DB31EC`).
- **Download & Print**: One-click download as PNG image or print directly for entrance presentation.
- **Durable Email Delivery**: Transactional HTML ticket emails powered by Resend with safe fallback logging.

### 📷 2. Multi-Gate Mobile Camera Scanner
- **Mobile-First Camera Scanner**: Uses the smartphone's rear camera with live laser reticle animation (`html5-qrcode`).
- **Gate Selection**: Support for multiple gates (`Main Auditorium Gate`, `East Academic Gate`, `VIP & Guest Gate`).
- **Acoustic & Haptic Feedback**: Real-time chimes for valid entry, warning buzzers for duplicates, and mobile vibration via Web Audio API.
- **In-Flight Lock & Debounce**: Prevents accidental duplicate submissions while camera rapidly scans frames.
- **Manual Entry Fallback**: Type ticket reference or token if attendee's phone screen is cracked or camera cannot read.
- **Personal Scan History**: Scanners can track their own gate admission log in real time.

### 🛡️ 3. Critical Invariant: Atomic Check-In
- **`SUCCESSFUL_CHECKINS_PER_TICKET <= 1`**:
  A ticket can have **ONLY ONE** successful admission.
- Executed as a single-document conditional atomic update:
  ```typescript
  db.collection('registrations').findOneAndUpdate(
    { tokenHash, eventId, status: 'ISSUED' },
    { $set: { status: 'USED', checkedInAt: now, checkedInBy: scannerId, gateId } },
    { returnDocument: 'after' }
  )
  ```
- **Stress-Tested Under Concurrency**: 50 simultaneous requests issued at the exact same millisecond against the same ticket resulted in **exactly 1 VALID** check-in and **49 DUPLICATE** rejections.

### 📊 4. Administrator Operations Dashboard
- **Live Operations Monitoring**: Total registrations, check-in percentage, duplicate scan blocks, and live incoming scan stream.
- **Attendee Management**: Live search, status filters (`ISSUED`, `USED`, `CANCELLED`), and ticket cancellation with mandatory audit reason.
- **Safe Ticket Resend**: AES-256-GCM server-side token encryption allows re-dispatching bounced emails without regenerating tickets or breaking printed QR codes.
- **Staff Provisioning**: Create scanner accounts, assign gates, and instantly revoke access (account deactivation is enforced live on every request).
- **Audit Trails & CSV Export**: Immutable scan logs, email logs, and one-click attendance report export with CSV formula injection protection (`=`, `+`, `-`, `@`).

---

## 🔐 Security Architecture

| Security Threat | Mitigation Strategy |
|---|---|
| **Double-Entry Race Conditions** | Single-document atomic `findOneAndUpdate` with precondition `{ status: 'ISSUED' }`. |
| **Token Forgery & Guessing** | Cryptographically secure 32-byte random tokens ($2^{256}$ entropy space). |
| **Database Compromise** | **Zero-Knowledge Storage**: Raw tokens are NEVER stored in plaintext. Only SHA-256 hashes are persisted. |
| **Multiple Admin Takeover** | Unique partial index `{ role: 'ADMIN', isActive: true }` restricts the database to exactly 1 active Admin. |
| **Session Hijacking / CSRF** | Signed JWT cookies with `HttpOnly`, `SameSite=Lax`, and `Secure` attributes. |
| **Brute Force & DoS** | Sliding-window in-memory rate limiting on login, registration, and scanning endpoints. |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+ / v24+
- **npm** or **pnpm** / **yarn**

### 2. Clone & Install
```bash
git clone https://github.com/Mesbah088/Event-management.git
cd Event-management
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory (refer to `.env.example`):
```bash
MONGODB_URI=mongodb://127.0.0.1:27017/university_events
MONGODB_DB_NAME=university_events
RESEND_API_KEY=re_placeholder_for_dev
EMAIL_FROM="NITER Islamic Society <events@yourdomain.com>"
APP_URL=http://localhost:3000
SESSION_SECRET=your_32_byte_secure_jwt_signing_key_here
INITIAL_ADMIN_EMAIL=admin@university.edu
INITIAL_ADMIN_PASSWORD=Admin1234!
INITIAL_ADMIN_NAME="System Administrator"
ADMIN_BOOTSTRAP_LOCKED=false
```

### 4. Start Local Development
Start the standalone development MongoDB engine (runs embedded MongoDB on port 27017 and auto-seeds the event & default accounts):
```bash
node scripts/dev-mongo.js
```

In another terminal, start the Next.js server:
```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🔑 Pre-Configured Test Accounts

| Role | Email | Password | Access URL |
|---|---|---|---|
| **System Administrator** | `admin@university.edu` | `Admin1234!` | [/admin](http://localhost:3000/admin) |
| **Gate Scanner Staff** | `scanner@university.edu` | `Scanner1234!` | [/scanner](http://localhost:3000/scanner) |

---

## 🧪 Automated Testing Suite

The project includes unit, integration, and high-concurrency race condition tests:

```bash
# Run all automated tests
npm test

# Run concurrency stress test specifically
npx vitest run src/__tests__/concurrency.test.ts

# Run strict TypeScript type checks
npm run typecheck

# Run production bundle build
npm run build
```

### Test Results (23 of 23 Passed):
```
 ✓ src/__tests__/schemas.test.ts (9 tests)
 ✓ src/__tests__/tokens.test.ts (6 tests)
 ✓ src/__tests__/concurrency.test.ts (3 tests)
   ✓ Critical Invariant: Atomic Check-In Concurrency Suite > guarantees SUCCESSFUL_CHECKINS_PER_TICKET <= 1 under 50 simultaneous concurrent scans (310ms)
 ✓ src/__tests__/integration.test.ts (5 tests)
   ✓ Integration Test Suite > Single-Admin Constraint & Concurrent Bootstrap (741ms)

Test Files  4 passed (4)
     Tests  23 passed (23)
```

---

## 🌐 Production Deployment (Vercel + MongoDB Atlas + Resend)

1. **MongoDB Atlas**:
   - Create an M0 free or production cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
   - In **Network Access**, allow access (`0.0.0.0/0` for serverless functions).
   - Run `node scripts/ensure-indexes.js` to build unique and compound indexes.
2. **Resend**:
   - Obtain an API key from [Resend](https://resend.com) and configure your verified sender domain.
3. **Vercel**:
   - Import this GitHub repository into Vercel.
   - Add environment variables (`MONGODB_URI`, `RESEND_API_KEY`, `SESSION_SECRET`, etc.).
   - Deploy! Vercel automatically enables HTTPS (mandatory for mobile WebRTC camera access).

---

## 📁 Project Structure

```
├── docs/                       # Comprehensive documentation & manuals
│   ├── DEPLOYMENT.md           # Atlas, Vercel, and Resend setup guide
│   ├── EVENT_DAY_GUIDE.md      # Volunteer scanner & dispute manual
│   ├── PROJECT_STATUS.md       # Implementation & test matrix
│   ├── SECURITY.md             # Threat modeling & cryptographic lifecycle
│   └── TECHNICAL_DESIGN.md     # Collections, schemas, & atomic pipelines
├── scripts/
│   ├── bootstrap-admin.js      # CLI one-time admin bootstrap
│   ├── dev-mongo.js            # Standalone dev Mongo runner with seeding
│   ├── ensure-indexes.js       # Production MongoDB index provisioning
│   └── seed-niter-event.js     # NITER Conference event seeder
├── src/
│   ├── __tests__/              # Vitest test suites (23 tests)
│   ├── app/
│   │   ├── admin/              # Admin dashboard pages
│   │   ├── api/                # Next.js Route Handlers
│   │   ├── events/[id]/        # Public event, register, & success pages
│   │   ├── login/              # Unified staff/admin authentication
│   │   └── scanner/            # Mobile camera QR scanner
│   ├── components/             # Reusable UI & Scanner components
│   ├── lib/
│   │   ├── auth/               # Passwords, JWT cookies, & RBAC guards
│   │   ├── crypto/             # 32-byte tokens, SHA-256, & AES-256-GCM
│   │   ├── db/                 # MongoDB singleton & index manager
│   │   └── email/              # Resend client & HTML templates
│   └── types/                  # TypeScript domain models
```

---

## 📜 License & Acknowledgments

Developed for **NITER ISLAMIC Conference 2026** by the Organizing Committee.  
Licensed under the [MIT License](LICENSE).
