# University Event QR Code Entry Management System — Project Plan

## 1. Executive Summary & Objective
The University Event QR Code Entry Management System is an enterprise-grade, high-throughput web application engineered for campus events, club workshops, hackathons, and symposiums (expected attendance: 500–2,000 attendees).
The system guarantees:
- Public attendee registration with concurrency-safe capacity enforcement and duplicate email protection.
- Instant cryptographically secure QR ticket generation (32-byte cryptographic token, stored exclusively as a SHA-256 hash).
- Durable multi-channel ticket delivery via Resend HTML/plain-text email with safe retry and on-screen ticket redemption.
- Multi-gate, multi-device mobile scanner interface with camera scanning, audio/haptic verification, and manual entry fallback.
- **Strict Atomic Check-in Invariant**: At most one check-in succeeds per ticket (`SUCCESSFUL_CHECKINS_PER_TICKET <= 1`), guaranteed through single-document conditional atomic database operations (`findOneAndUpdate`).
- Granular Role-Based Access Control (RBAC): Public Attendee, authorized Scanner (assigned to events and gates), and a strictly enforced single Admin identity with audited mutations.

---

## 2. Architecture & Tech Stack
- **Framework**: Next.js 14 App Router (Node.js runtime, TypeScript strict mode).
- **Styling**: Tailwind CSS, custom design tokens, dark/light contrast-optimized UI for scanner devices.
- **Database**: MongoDB Atlas / native MongoDB driver with connection pooling singleton and compound/unique indexes.
- **Security & Auth**: Jose (JWT in HttpOnly, SameSite=Lax, Secure cookies), bcryptjs password hashing, SHA-256 token hashing, in-memory rate limiting.
- **QR Code Engine**: `qrcode` (SVG/Canvas/DataURL generation) and `html5-qrcode` / `@zxing/browser` for mobile camera stream decoding.
- **Email Delivery**: Resend SDK with HTML email templates, tracking logs, and admin retry capability.
- **Testing**: Vitest for unit, integration, and high-concurrency race condition testing.

---

## 3. Implementation Phases & Roadmap

| Phase | Description | Deliverables | Status |
|---|---|---|---|
| **Phase 1** | Project Planning & Documentation | Architecture diagrams, specifications, security design, and event day procedures. | **Completed** |
| **Phase 2** | Project Scaffold & Database Layer | Next.js setup, TypeScript config, MongoDB connection singleton, collections, Zod schemas, index bootstrap. | **Completed** |
| **Phase 3** | Authentication & RBAC | One-time Admin bootstrap, password hashing, JWT HttpOnly cookies, session management, middleware auth guards. | **Completed** |
| **Phase 4** | Public Event Portal & Registration | Landing page, event details, registration forms, atomic capacity check, unique email constraint. | **Completed** |
| **Phase 5** | QR Code Generation & Email Delivery | Cryptographic 32-byte token generation, SHA-256 hash storage, Resend transactional email, emailLogs. | **Completed** |
| **Phase 6** | Atomic Check-In & Scanner Interface | Atomic `findOneAndUpdate` check-in API, mobile camera scanner, audio feedback, debounce/in-flight locks, manual fallback. | **Completed** |
| **Phase 7** | Admin Operations Dashboard | Real-time analytics, event management, attendee management, scanner account provisioning, CSV export. | **Completed** |
| **Phase 8** | Scan Logs, Audit Trails & Observability | Scan attempt audit trail, email retry dashboard, audit logs, sanitized operational metrics. | **Completed** |
| **Phase 9** | Automated Testing & Concurrency Suite | Unit tests, API integration tests, simultaneous check-in concurrency race condition verification. | **Completed** |
| **Phase 10** | Hardening, Performance & Build | Linting, strict type checking, production bundle build verification, security audit. | **Completed** |
| **Phase 11** | Deployment Guides & Event-Day Manual | Vercel + MongoDB Atlas deployment guide, volunteer scanner quick-start manual, offline contingency plan. | **Completed** |

---

## 4. Key Invariants & Non-Negotiables
1. **Concurrency Invariant**: Under simultaneous concurrent requests across distributed scanner devices, exactly one check-in can succeed. All subsequent or parallel attempts must return `DUPLICATE`.
2. **Zero Plaintext Secrets**: Raw ticket tokens are never stored in the database, server logs, scan logs, or analytics. Only SHA-256 hashes are persisted.
3. **Single Admin Identity**: Exactly one active Admin account is permitted. Enforced both at application startup and via unique database index constraints.
4. **Offline & Network Resilience**: Network timeouts return `UNKNOWN_STATE` with clear instructions to verify before admitting attendees.
