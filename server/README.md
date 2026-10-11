# 🖥️ Standalone Backend Server — NITER ISLAMIC Conference 2026

This directory contains the standalone Node.js & Express backend API server for the **NITER ISLAMIC Conference 2026 QR Entry Management System**.

## 🚀 How to Run

```bash
cd server
npm install
npm start
```

Default Port: `http://localhost:5000`

## 📡 API Endpoints

- `GET  /api/health` — Server health & registration statistics
- `POST /api/auth/login` — Staff & Admin authentication
- `GET  /api/events` — Event information & seat availability
- `POST /api/events/:id/register` — Attendee registration & QR issuance
- `POST /api/scanner/check-in` — High-speed atomic QR ticket admission
- `GET  /api/admin/dashboard` — Live operations dashboard statistics
