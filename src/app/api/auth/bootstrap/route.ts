import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ensureIndexes } from '@/lib/db/indexes';
import { hashPassword } from '@/lib/auth/password';
import { bootstrapSchema } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/utils/audit';
import { checkRateLimit, getClientIp } from '@/lib/utils/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limitCheck = checkRateLimit(`bootstrap:${ip}`, 5, 60 * 1000);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    if (process.env.ADMIN_BOOTSTRAP_LOCKED === 'true') {
      return NextResponse.json({ error: 'Admin bootstrap is locked by administrator policy.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const validated = bootstrapSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.errors[0]?.message || 'Invalid input' }, { status: 400 });
    }

    const db = await getDb();
    await ensureIndexes(db);

    // Atomically check if an active Admin already exists
    const existingAdmin = await db.collection('users').findOne({ role: 'ADMIN', isActive: true });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'An active Administrator already exists. Duplicate Admin registration is rejected.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(validated.data.password);
    const now = new Date();

    const newAdmin = {
      name: validated.data.name,
      email: validated.data.email,
      passwordHash,
      role: 'ADMIN' as const,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const result = await db.collection('users').insertOne(newAdmin);
      await logAuditEvent(
        db,
        { id: result.insertedId, email: validated.data.email },
        'ADMIN_BOOTSTRAP',
        'users',
        result.insertedId,
        { email: validated.data.email }
      );

      return NextResponse.json({
        success: true,
        message: 'Administrator successfully initialized.',
        admin: {
          id: result.insertedId.toString(),
          name: newAdmin.name,
          email: newAdmin.email,
          role: 'ADMIN',
        },
      });
    } catch (insertError: any) {
      if (insertError.code === 11000) {
        return NextResponse.json(
          { error: 'Conflict: An Administrator account already exists.' },
          { status: 409 }
        );
      }
      throw insertError;
    }
  } catch (error: any) {
    console.error('Bootstrap API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error during bootstrap.' },
      { status: 500 }
    );
  }
}
