import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { SessionUser, UserRole } from '@/types';

const SESSION_COOKIE_NAME = 'ue_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'university_event_default_secure_secret_fallback_key_2026_at_least_32_chars';
const secretKey = new TextEncoder().encode(SESSION_SECRET);

export async function createSessionToken(user: SessionUser): Promise<string> {
  const expirationTime = user.role === 'ADMIN' ? '8h' : '12h';

  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    assignedEventIds: user.assignedEventIds,
    defaultGate: user.defaultGate,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(secretKey);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as UserRole,
      assignedEventIds: payload.assignedEventIds as string[] | undefined,
      defaultGate: payload.defaultGate as string | undefined,
    };
  } catch (err) {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser): Promise<string> {
  const token = await createSessionToken(user);
  const cookieStore = cookies();
  const maxAge = user.role === 'ADMIN' ? 8 * 60 * 60 : 12 * 60 * 60;

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });

  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!tokenCookie || !tokenCookie.value) {
    return null;
  }

  return verifySessionToken(tokenCookie.value);
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
