import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth/rbac';
import { hashPassword } from '@/lib/auth/password';
import { scannerCreateSchema } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/utils/audit';
import { User, ScanLog } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAuth(['ADMIN']);
    if (!auth.success) return auth.response;

    const db = await getDb();
    const scanners = await db
      .collection<User>('users')
      .find({ role: 'SCANNER' })
      .sort({ createdAt: -1 })
      .toArray();

    // Fetch scan counts per scanner
    const scanCounts = await db
      .collection<ScanLog>('scanLogs')
      .aggregate([
        { $group: { _id: '$scannerId', count: { $sum: 1 } } },
      ])
      .toArray();

    const countMap = new Map(scanCounts.map(s => [s._id.toString(), s.count]));

    const formatted = scanners.map(s => ({
      id: s._id!.toString(),
      name: s.name,
      email: s.email,
      role: s.role,
      isActive: s.isActive,
      assignedEventIds: s.assignedEventIds?.map(id => id.toString()) || [],
      defaultGate: s.defaultGate || 'Main Gate',
      scanCount: countMap.get(s._id!.toString()) || 0,
      createdAt: s.createdAt,
      lastLoginAt: s.lastLoginAt,
    }));

    return NextResponse.json({ scanners: formatted });
  } catch (error: any) {
    console.error('Admin scanners list error:', error);
    return NextResponse.json({ error: 'Failed to retrieve scanners.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(['ADMIN']);
    if (!auth.success) return auth.response;

    const body = await request.json().catch(() => ({}));
    const validated = scannerCreateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Invalid scanner data.' },
        { status: 400 }
      );
    }

    const { name, email, password, assignedEventIds, defaultGate } = validated.data;
    const db = await getDb();

    // Check email uniqueness
    const existing = await db.collection<User>('users').findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email address already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();

    const newScanner: User = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'SCANNER',
      isActive: true,
      assignedEventIds: assignedEventIds ? assignedEventIds.map(id => new ObjectId(id)) : [],
      defaultGate: defaultGate ? defaultGate.trim() : 'Main Gate',
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection('users').insertOne(newScanner);

    await logAuditEvent(
      db,
      { id: auth.user.id, email: auth.user.email },
      'SCANNER_CREATE',
      'users',
      result.insertedId,
      { name: newScanner.name, email: newScanner.email }
    );

    return NextResponse.json({
      success: true,
      scanner: {
        id: result.insertedId.toString(),
        name: newScanner.name,
        email: newScanner.email,
        role: newScanner.role,
        isActive: newScanner.isActive,
        defaultGate: newScanner.defaultGate,
      },
    });
  } catch (error: any) {
    console.error('Admin scanner create error:', error);
    return NextResponse.json({ error: 'Failed to create scanner account.' }, { status: 500 });
  }
}
