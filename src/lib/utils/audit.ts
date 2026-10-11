import { Db, ObjectId } from 'mongodb';
import { AuditAction, AuditLog } from '@/types';

export async function logAuditEvent(
  db: Db,
  actor: { id: string | ObjectId; email: string },
  action: AuditAction,
  targetCollection: string,
  targetId: string | ObjectId,
  details?: Record<string, any>
): Promise<void> {
  try {
    const log: AuditLog = {
      actorId: new ObjectId(actor.id),
      actorEmail: actor.email,
      action,
      targetCollection,
      targetId: new ObjectId(targetId),
      details,
      timestamp: new Date(),
    };
    await db.collection('auditLogs').insertOne(log);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
