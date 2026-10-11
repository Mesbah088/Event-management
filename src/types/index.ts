import { ObjectId } from 'mongodb';

export type UserRole = 'ADMIN' | 'SCANNER';

export interface User {
  _id?: ObjectId;
  name: string;
  email: string; // Normalized lowercase
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  assignedEventIds?: ObjectId[];
  defaultGate?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

export interface Event {
  _id?: ObjectId;
  slug: string;
  title: string;
  description: string;
  organizer: string;
  venue: string;
  startDate: Date;
  endDate: Date;
  registrationOpenAt: Date;
  registrationCloseAt: Date;
  capacity: number;
  registeredCount: number;
  status: EventStatus;
  gates: string[];
  ticketExpiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TicketStatus = 'ISSUED' | 'USED' | 'CANCELLED';
export type EmailDeliveryStatus = 'PENDING' | 'SENT' | 'FAILED' | 'DEV_MOCKED';

export interface Registration {
  _id?: ObjectId;
  eventId: ObjectId;
  attendeeName: string;
  attendeeEmail: string; // Normalized lowercase
  attendeePhone?: string;
  customFields?: Record<string, string>;
  ticketRef: string; // e.g. "UE-2026-X8Y1"
  tokenHash: string; // SHA-256 hex of 32-byte secret
  encryptedToken?: string; // AES-256-GCM encrypted secret for durable email retry
  status: TicketStatus;
  registeredAt: Date;
  checkedInAt?: Date;
  checkedInBy?: ObjectId;
  gateId?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  emailStatus: EmailDeliveryStatus;
  emailLastAttemptAt?: Date;
  emailError?: string;
}

export type ScanOutcome =
  | 'VALID'
  | 'DUPLICATE'
  | 'INVALID'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'WRONG_EVENT';

export interface ScanLog {
  _id?: ObjectId;
  eventId: ObjectId;
  scannerId: ObjectId;
  scannerName: string;
  gateId: string;
  ticketRef?: string;
  outcome: ScanOutcome;
  timestamp: Date;
  notes?: string;
}

export interface EmailLog {
  _id?: ObjectId;
  registrationId: ObjectId;
  eventId: ObjectId;
  recipientEmail: string;
  provider: 'resend' | 'mock';
  providerMessageId?: string;
  status: 'SUCCESS' | 'FAILED' | 'QUEUED';
  attempts: number;
  lastAttemptAt: Date;
  sanitizedError?: string;
}

export type AuditAction =
  | 'EVENT_CREATE'
  | 'EVENT_UPDATE'
  | 'EVENT_STATUS_CHANGE'
  | 'TICKET_CANCEL'
  | 'SCANNER_CREATE'
  | 'SCANNER_STATUS_CHANGE'
  | 'SCANNER_PASSWORD_RESET'
  | 'EMAIL_RESEND'
  | 'ADMIN_BOOTSTRAP';

export interface AuditLog {
  _id?: ObjectId;
  actorId: ObjectId;
  actorEmail: string;
  action: AuditAction;
  targetCollection: string;
  targetId: ObjectId;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedEventIds?: string[];
  defaultGate?: string;
}
