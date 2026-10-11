/**
 * Standalone Backend API Server
 * NITER ISLAMIC Conference 2026 — QR Entry Management System
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-Memory Database store for standalone execution
const db = {
  users: [
    {
      id: 'usr_admin',
      name: 'System Administrator',
      email: 'admin@university.edu',
      passwordHash: '$2b$10$T3035Nu21kzC0hZfRPauq.c5tC2J6t65NgWV4MA3NdYGrpL1dElgm', // Admin1234!
      role: 'ADMIN',
      isActive: true,
    },
    {
      id: 'usr_scanner',
      name: 'Gate Scanner Staff',
      email: 'scanner@university.edu',
      passwordHash: '$2b$10$odc0f.rwN2yo8xM12dfxTucgx6UpmPXUxWp6hD9ksvpS1iNdFzkvq', // Scanner1234!
      role: 'SCANNER',
      defaultGate: 'Main Auditorium Gate',
      isActive: true,
    },
  ],
  event: {
    id: 'evt_niter_2026',
    slug: 'niter-islamic-conference-2026',
    title: 'NITER ISLAMIC Conference 2026',
    organizer: 'NITER Islamic Society',
    venue: 'NITER Central Auditorium & Campus Complex, Nayarhat, Savar, Dhaka',
    capacity: 1500,
    registeredCount: 0,
    status: 'PUBLISHED',
    gates: ['Main Auditorium Gate', 'East Academic Gate', 'VIP & Guest Gate'],
  },
  registrations: [],
  scanLogs: [],
};

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    event: db.event.title,
    registeredAttendees: db.registrations.length,
    timestamp: new Date().toISOString(),
  });
});

// 2. Auth: Staff & Admin Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = db.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase().trim());

  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      defaultGate: user.defaultGate,
    },
  });
});

// 3. Events: Get Event Info
app.get('/api/events', (req, res) => {
  res.json([
    {
      ...db.event,
      remainingSeats: Math.max(0, db.event.capacity - db.registrations.length),
    },
  ]);
});

// 4. Registration: Register Attendee
app.post('/api/events/:id/register', async (req, res) => {
  const { name, email, phone, studentId, department } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = db.registrations.find((r) => r.attendeeEmail === normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'This email is already registered for this conference.' });
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const ticketRef = `NITER-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const registration = {
    id: `reg_${Date.now()}`,
    ticketRef,
    attendeeName: name.trim(),
    attendeeEmail: normalizedEmail,
    attendeePhone: phone || '',
    studentId: studentId || '',
    department: department || '',
    tokenHash,
    status: 'ISSUED',
    createdAt: new Date(),
  };

  db.registrations.push(registration);
  db.event.registeredCount = db.registrations.length;

  res.status(201).json({
    success: true,
    ticket: {
      ticketRef,
      attendeeName: registration.attendeeName,
      attendeeEmail: registration.attendeeEmail,
      eventTitle: db.event.title,
      venue: db.event.venue,
      rawToken, // Provided once on issuance
    },
  });
});

// 5. Scanner: Atomic Check-in
app.post('/api/scanner/check-in', (req, res) => {
  const { token, ticketRef, gateId = 'Main Gate', scannerId = 'staff' } = req.body || {};

  let target = null;
  if (token) {
    const hash = crypto.createHash('sha256').update(token.trim()).digest('hex');
    target = db.registrations.find((r) => r.tokenHash === hash);
  } else if (ticketRef) {
    target = db.registrations.find((r) => r.ticketRef === ticketRef.trim().toUpperCase());
  }

  if (!target) {
    db.scanLogs.push({ outcome: 'INVALID_TOKEN', timestamp: new Date(), gateId, scannerId });
    return res.status(404).json({ outcome: 'INVALID_TOKEN', message: 'Ticket not found or invalid.' });
  }

  if (target.status === 'USED') {
    db.scanLogs.push({ outcome: 'DUPLICATE', ticketRef: target.ticketRef, timestamp: new Date(), gateId, scannerId });
    return res.status(409).json({
      outcome: 'DUPLICATE',
      message: 'Access Denied: Ticket has already been used.',
      checkedInAt: target.checkedInAt,
      checkedInGate: target.gateId,
    });
  }

  // Atomic state change
  target.status = 'USED';
  target.checkedInAt = new Date();
  target.gateId = gateId;
  target.checkedInBy = scannerId;

  db.scanLogs.push({ outcome: 'VALID', ticketRef: target.ticketRef, timestamp: new Date(), gateId, scannerId });

  res.json({
    outcome: 'VALID',
    message: 'Access Granted: Welcome to NITER ISLAMIC Conference 2026!',
    attendeeName: target.attendeeName,
    ticketRef: target.ticketRef,
  });
});

// 6. Admin: Dashboard Stats
app.get('/api/admin/dashboard', (req, res) => {
  const total = db.registrations.length;
  const used = db.registrations.filter((r) => r.status === 'USED').length;

  res.json({
    totalRegistrations: total,
    totalCheckedIn: used,
    capacity: db.event.capacity,
    checkInRate: total > 0 ? Math.round((used / total) * 100) : 0,
    recentScans: db.scanLogs.slice(-10).reverse(),
  });
});

app.listen(PORT, () => {
  console.log(`✓ Standalone Backend Server running on port ${PORT}`);
  console.log(`  Event: ${db.event.title}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
});
