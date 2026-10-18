import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registrationSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  phone: z.string().trim().max(25, 'Phone number is too long').optional().or(z.literal('')),
  attendeeType: z.enum(['NITER_STUDENT', 'NITER_ALUMNI', 'EXTERNAL_STUDENT', 'GUEST']).default('EXTERNAL_STUDENT'),
  batch: z.string().trim().max(50).optional().or(z.literal('')),
  studentId: z.string().trim().max(50).optional().or(z.literal('')),
  department: z.string().trim().max(100).optional().or(z.literal('')),
  institution: z.string().trim().max(150).optional().or(z.literal('')),
  trxId: z.string().trim().max(50).optional().or(z.literal('')),
  senderPhone: z.string().trim().max(25).optional().or(z.literal('')),
  paymentAmount: z.string().trim().max(20).optional().or(z.literal('')),
  paymentMethod: z.enum(['bKash', 'Nagad']).optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.attendeeType === 'EXTERNAL_STUDENT') {
    if (!data.institution || !data.institution.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'বিশ্ববিদ্যালয়ের নাম (University name) প্রদান করা আবশ্যক।',
        path: ['institution'],
      });
    }
    if (!data.trxId || !data.trxId.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'রেজিস্ট্রেশনের জন্য পেমেন্ট বাধ্যতামূলক। Transaction ID (TrxID) প্রদান করুন।',
        path: ['trxId'],
      });
    }
    if (!data.senderPhone || !data.senderPhone.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'যে নম্বর থেকে টাকা পাঠানো হয়েছে সেই প্রেরক নম্বরটি (Sender Phone) প্রদান করা আবশ্যক।',
        path: ['senderPhone'],
      });
    }
    const amount = Number(data.paymentAmount);
    if (!data.paymentAmount || isNaN(amount) || amount < 499) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'রেজিস্ট্রেশন ফি ৪৯৯ টাকা পরিশোধ করা বাধ্যতামূলক।',
        path: ['paymentAmount'],
      });
    }
  }
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
