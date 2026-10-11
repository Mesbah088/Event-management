import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth/rbac';
import { hashPassword } from '@/lib/auth/password';
import { scannerUpdateSchema } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/utils/audit';
import { User } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(['ADMIN']);
    if (!auth.success) return auth.response;

    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const validated = scannerUpdateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Invalid scanner update data.' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const existing = await db.collection<User>('users').findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json({ error: 'Scanner account not found.' }, { status: 404 });
    }

    if (existing.role === 'ADMIN') {
      return NextResponse.json({ error: 'Cannot modify Admin account through scanner API.' }, { status: 403 });
    }

    const updateFields: any = { updatedAt: new Date() };

    if (typeof validated.data.isActive === 'boolean') {
      updateFields.isActive = validated.data.isActive;
    }
    if (validated.data.name) {
      updateFields.name = validated.data.name.trim();
    }
    if (validated.data.defaultGate) {
      updateFields.defaultGate = validated.data.defaultGate.trim();
    }
    if (validated.data.assignedEventIds) {
      updateFields.assignedEventIds = validated.data.assignedEventIds.map(eId => new ObjectId(eId));
    }
    if (validated.data.password) {
      updateFields.passwordHash = await hashPassword(validated.data.password);
    }

    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    await logAuditEvent(
      db,
      { id: auth.user.id, email: auth.user.email },
      validated.data.password ? 'SCANNER_PASSWORD_RESET' : 'SCANNER_STATUS_CHANGE',
      'users',
      id,
      {
        scannerEmail: existing.email,
        isActive: updateFields.isActive,
        passwordChanged: !!validated.data.password,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Scanner account updated successfully.',
    });
  } catch (error: any) {
    console.error('Admin scanner update error:', error);
    return NextResponse.json({ error: 'Failed to update scanner account.' }, { status: 500 });
  }
}
