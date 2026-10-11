import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getSession } from './session';
import { getDb } from '@/lib/db/mongodb';
import { SessionUser, UserRole, User } from '@/types';

export interface AuthResultSuccess {
  user: SessionUser;
  dbUser: User;
}

export type AuthResult =
  | { success: true; user: SessionUser; dbUser: User }
  | { success: false; response: NextResponse };

/**
 * Server-side RBAC verification.
 * Verifies the JWT session AND checks live account active status in MongoDB.
 */
export async function requireAuth(allowedRoles: UserRole[]): Promise<AuthResult> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      ),
    };
  }

  // Live database check to verify the account has not been deactivated
  const db = await getDb();
  let dbUser: User | null = null;
  try {
    dbUser = await db.collection<User>('users').findOne({ _id: new ObjectId(session.id) });
  } catch (err) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid user session format.' },
        { status: 401 }
      ),
    };
  }

  if (!dbUser || !dbUser.isActive) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Account is deactivated or does not exist.' },
        { status: 403 }
      ),
    };
  }

  if (!allowedRoles.includes(dbUser.role)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Forbidden: Insufficient privileges.' },
        { status: 403 }
      ),
    };
  }

  return {
    success: true,
    user: {
      id: dbUser._id!.toString(),
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      assignedEventIds: dbUser.assignedEventIds?.map(id => id.toString()),
      defaultGate: dbUser.defaultGate,
    },
    dbUser,
  };
}
