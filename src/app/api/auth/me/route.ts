import { NextResponse } from 'next/server';
import { clearSessionCookie, getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { User } from '@/types';

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true, message: 'Logged out successfully.' });
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // Live lookup to verify the user is still active in the database
  try {
    const db = await getDb();
    const dbUser = await db.collection<User>('users').findOne({ _id: new ObjectId(session.id) });

    if (!dbUser || !dbUser.isActive) {
      await clearSessionCookie();
      return NextResponse.json({ authenticated: false, user: null, error: 'Account deactivated' }, { status: 403 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: dbUser._id!.toString(),
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        assignedEventIds: dbUser.assignedEventIds?.map(id => id.toString()),
        defaultGate: dbUser.defaultGate,
      },
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }
}
