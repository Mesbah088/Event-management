# University Event QR Code Entry Management System — Deployment Guide

## 1. Prerequisites
- **Node.js**: v18.17+ or v20+ / v22+
- **MongoDB Atlas**: A free M0 or production M10+ cluster
- **Resend Account**: API Key and verified domain or `@resend.dev` onboarding domain
- **Vercel Account**: For deploying the Next.js App Router application

---

## 2. Environment Configuration
Create `.env.local` for local development or configure environment variables in the Vercel dashboard:

```bash
# Database Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=university_events

# Resend Transactional Email
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM="Tech Club Events <events@yourdomain.com>"

# Application Base URL (for QR verification links and asset resolution)
APP_URL=https://events.yourcampus.edu

# Session & Security
# Generate using: openssl rand -base64 32
SESSION_SECRET=your_32_byte_cryptographic_session_secret_key_minimum_length

# Initial One-Time Admin Bootstrap Credentials
INITIAL_ADMIN_EMAIL=admin@yourcampus.edu
INITIAL_ADMIN_PASSWORD=ChangeMeImmediatelyOnFirstLogin2026!
INITIAL_ADMIN_NAME="System Administrator"

# Optional Setup Lock (set to true once bootstrap is completed to disable setup endpoint)
ADMIN_BOOTSTRAP_LOCKED=false
```

---

## 3. MongoDB Atlas Setup
1. Create a MongoDB Atlas cluster.
2. Under **Network Access**, add IP `0.0.0.0/0` (or Vercel IP range) to allow serverless function connections.
3. Under **Database Access**, create a user with `readWrite` permissions on database `university_events`.
4. Copy the connection string to `MONGODB_URI`.
5. Run the indexing script to build required unique and compound indexes:
   ```bash
   node scripts/ensure-indexes.js
   ```

---

## 4. Initial Admin Bootstrap
Run the one-time bootstrap script before opening the system to public traffic:
```bash
node scripts/bootstrap-admin.js
```
Alternatively, on first deployment, open:
`POST /api/auth/bootstrap` (guarded by `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`).

Once bootstrapped:
- Log in at `/admin/login`.
- Verify the single-admin constraint is active in the database.
- Disable `ADMIN_BOOTSTRAP_LOCKED=true` in environment variables.

---

## 5. Vercel Deployment
1. Push your repository to GitHub / GitLab.
2. Import the project in Vercel.
3. In Project Settings -> Environment Variables, input all variables from Section 2.
4. Deploy. Vercel automatically enables HTTPS (required for scanner camera access via WebRTC).
