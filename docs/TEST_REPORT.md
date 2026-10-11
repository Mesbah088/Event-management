# University Event QR Code Entry Management System — Test Report

## 1. Automated Test Execution Summary
- **Test Runner**: Vitest v3.2.7 (Node.js ES2022 Runtime)
- **Database Engine**: Embedded MongoDB Memory Server (Replica-compatible engine running live database queries & indexes)
- **Test Results**: **4 Test Files Passed, 23 of 23 Tests Passed (100% Success)**
- **Total Duration**: 32.10s

```
 ✓ src/__tests__/schemas.test.ts (9 tests)
 ✓ src/__tests__/tokens.test.ts (6 tests)
 ✓ src/__tests__/concurrency.test.ts (3 tests)
   ✓ Critical Invariant: Atomic Check-In Concurrency Suite > guarantees SUCCESSFUL_CHECKINS_PER_TICKET <= 1 under 50 simultaneous concurrent scans (310ms)
 ✓ src/__tests__/integration.test.ts (5 tests)
   ✓ Integration Test Suite > Single-Admin Constraint & Concurrent Bootstrap > enforces exactly ONE active Admin identity at database engine level (715ms)

Test Files  4 passed (4)
     Tests  23 passed (23)
```

---

## 2. Invariant & Scenario Verification Matrix

| Scenario / Invariant | Test File & Suite | Verification Detail | Result |
|---|---|---|---|
| **1. Atomic Check-In Invariant** | `src/__tests__/concurrency.test.ts` | 50 concurrent requests simultaneously issued against the exact same valid ticket token across 50 distinct scanner IDs. | **PASSED** (Exactly 1 VALID, 49 DUPLICATE) |
| **2. Multi-Ticket Concurrency** | `src/__tests__/concurrency.test.ts` | Different tickets scanned simultaneously by different scanners at different gates. | **PASSED** (Both admitted independently) |
| **3. Cancelled / Fake Tokens** | `src/__tests__/concurrency.test.ts` | Cancelled tickets and randomly forged tokens rejected by atomic filter. | **PASSED** (0 admitted) |
| **4. Single-Admin Invariant** | `src/__tests__/integration.test.ts` | Unique partial index on `{ role: 'ADMIN', isActive: true }` blocks concurrent or secondary Admin account creation (Error code 11000). | **PASSED** (Exactly 1 active Admin permitted) |
| **5. Duplicate Email Prevention** | `src/__tests__/integration.test.ts` | Unique compound index on `{ eventId: 1, attendeeEmail: 1 }` rejects repeat registrations for the same event. | **PASSED** (Unique index rejection) |
| **6. Multi-Event Registrations** | `src/__tests__/integration.test.ts` | Same attendee email successfully allowed to register for different events. | **PASSED** |
| **7. Atomic Capacity Limits** | `src/__tests__/integration.test.ts` | 10 concurrent requests to reserve seats for an event with capacity 5. | **PASSED** (5 succeeded, 5 rejected) |
| **8. Token Cryptography & Entropy** | `src/__tests__/tokens.test.ts` | 32-byte cryptographic random generator (256-bit entropy) and SHA-256 hash determinism. | **PASSED** |
| **9. Zero-Knowledge Token Storage** | `src/__tests__/tokens.test.ts` | Plaintext tokens never stored in database; AES-256-GCM server-side key encryption enables safe idempotent email retries. | **PASSED** |
| **10. Zod Validation & Normalization** | `src/__tests__/schemas.test.ts` | Email normalization, slug regex, capacity boundaries, password length checks. | **PASSED** |

---

## 3. High-Concurrency Stress Test Detail
Under `src/__tests__/concurrency.test.ts`:
- **Target Invariant**: `SUCCESSFUL_CHECKINS_PER_TICKET <= 1`
- **Setup**: One ticket seeded with `status: 'ISSUED'`.
- **Execution**: 50 simultaneous `findOneAndUpdate` operations issued with `Promise.all()`.
- **Results Recorded**:
  - `validCount === 1`
  - `duplicateCount === 49`
  - `scanLogs` audit entries: Exactly 1 entry with `outcome: 'VALID'`, 49 entries with `outcome: 'DUPLICATE'`.
  - Final ticket status in MongoDB: `status: 'USED'`.
