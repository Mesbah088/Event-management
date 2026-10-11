import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registrationSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  phone: z.string().trim().regex(/^[0-9+()\- ]*$/, 'Invalid phone number').optional().or(z.literal('')),
  studentId: z.string().trim().max(50).optional().or(z.literal('')),
  department: z.string().trim().max(100).optional().or(z.literal('')),
});

export const eventSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  organizer: z.string().trim().min(2, 'Organizer name is required'),
  venue: z.string().trim().min(2, 'Venue is required'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  registrationOpenAt: z.string().datetime(),
  registrationCloseAt: z.string().datetime(),
  capacity: z.coerce.number().int().positive('Capacity must be greater than zero'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']).default('PUBLISHED'),
  gates: z.array(z.string().trim().min(1)).min(1, 'At least one gate must be configured'),
  ticketExpiryDate: z.string().datetime().optional().nullable(),
});

export const checkInSchema = z.object({
  token: z.string().trim().min(10, 'Invalid QR code token'),
  eventId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID'),
  gateId: z.string().trim().min(1, 'Gate is required'),
});

export const scannerCreateSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  assignedEventIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  defaultGate: z.string().trim().optional(),
});

export const scannerUpdateSchema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().trim().min(2).optional(),
  password: z.string().min(8).optional(),
  assignedEventIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  defaultGate: z.string().trim().optional(),
});

export const ticketCancelSchema = z.object({
  reason: z.string().trim().min(3, 'Reason is required').max(300),
});

export const bootstrapSchema = z.object({
  name: z.string().trim().min(2).default('Super Administrator'),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  bootstrapSecret: z.string().optional(),
});
