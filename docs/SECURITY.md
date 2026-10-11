# University Event QR Code Entry Management System — Security Architecture

## 1. Threat Modeling & Security Controls

| Threat Category | Potential Risk | Security Mitigation & Design Control |
|---|---|---|
| **Race Conditions / Double Entry** | Simultaneous scanning of identical QR across two gates. | Single-document atomic `findOneAndUpdate` with precondition `{ status: 'ISSUED' }`. Guaranteed at database storage engine level. |
| **Token Forgery & Guessing** | Attacker attempts to guess valid ticket QR codes. | Cryptographically strong 32-byte (256-bit entropy) raw tokens. Infeasible to brute-force ($2^{256}$ space). |
| **Database Compromise** | Exposure of registration database allows ticket extraction. | Zero-knowledge token storage: only SHA-256 hashes are persisted. The raw token is known only to the attendee. |
| **Unauthorized Scanner / Admin Access** | Public user attempts to access scanning or admin endpoints. | Server-side RBAC validation on every Route Handler using signed, HttpOnly, SameSite=Lax JWT cookies. |
| **Multiple Admin Hijacking** | Creation of rogue Admin identities. | Single-Admin database invariant: partial unique index on `{ role: 'ADMIN', isActive: true }` combined with atomic bootstrap locking. |
| **Denial of Service / Brute Force** | High-volume registration or check-in spamming. | Sliding-window IP and token rate limiting on all public and authentication endpoints. |
| **Credential Sniffing** | Token interception in transit. | Mandatory HTTPS (HSTS header enabled). Secure cookie flags (`HttpOnly; Secure; SameSite=Lax`). |
| **NoSQL Injection** | Payload manipulation in MongoDB query parameters. | Strict Zod validation on all endpoint inputs, stripping unexpected fields and forcing strict scalar types. |
| **Information Disclosure** | Stack traces or database credentials leaked in errors. | Centralized error sanitization: only sanitized user-facing messages are returned to clients. |

---

## 2. Authentication & Session Strategy
- **Session Tokens**: Handled via `jose` library producing encrypted/signed JSON Web Tokens.
- **Cookie Security Attributes**:
  - `HttpOnly`: Mitigates XSS token extraction.
  - `SameSite=Lax`: Defends against Cross-Site Request Forgery (CSRF).
  - `Secure`: Ensures transmission strictly over TLS/HTTPS (conditionally true in production).
  - `Path=/`: Scoped session lifetime (defaults to 12 hours for Scanners, 8 hours for Admin).
- **Password Storage**: Passwords are hashed with `bcryptjs` using a minimum salt factor of 12.

---

## 3. QR Token Lifecycle & Cryptography
```
1. Attendee Registers
   ├── crypto.randomBytes(32) -> rawToken (e.g. "a9f8...d4c1")
   ├── crypto.createHash('sha256').update(rawToken).digest('hex') -> tokenHash
   └── db.registrations.insertOne({ tokenHash, status: 'ISSUED' })
2. QR Code Generated
   └── payload = rawToken (or verification URL with rawToken)
   └── Rendered directly to attendee email and confirmation page
3. Scanner Scans QR
   └── scanner reads rawToken from camera
   └── sends rawToken to POST /api/scanner/check-in
   └── server calculates candidateHash = sha256(rawToken)
   └── atomic query against tokenHash in DB
```

---

## 4. Administrative Auditing & Non-Repudiation
Every state mutation (ticket cancellation, scanner account activation/deactivation, email resend, event capacity modification) generates a permanent entry in `auditLogs` containing the authenticated actor's ID, timestamp, target entity, and diff metadata.
