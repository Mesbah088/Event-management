import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { verifyPassword } from '@/lib/auth/password';
import { setSessionCookie } from '@/lib/auth/session';
import { loginSchema } from '@/lib/validation/schemas';
import { checkRateLimit, getClientIp } from '@/lib/utils/rate-limit';
import { User } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limitCheck = checkRateLimit(`login:${ip}`, 10, 60 * 1000); // 10 attempts per minute
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validated = loginSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Invalid email or password.' },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;
    const normalizedEmail = email.trim().toLowerCase();
    const db = await getDb();
    const user = await db.collection<User>('users').findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact the administrator.' },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Update lastLoginAt
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } }
    );

    const sessionUser = {
      id: user._id!.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      assignedEventIds: user.assignedEventIds?.map(id => id.toString()),
      defaultGate: user.defaultGate,
    };

    await setSessionCookie(sessionUser);

    return NextResponse.json({
      success: true,
      user: sessionUser,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    if (error?.message?.includes('ECONNREFUSED') || error?.name?.includes('Mongo') || error?.message?.includes('topology')) {
      return NextResponse.json(
        { error: 'Database connection error: MONGODB_URI is not configured in Vercel environment variables.' },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: 'Internal server error during authentication.' }, { status: 500 });
  }
}
