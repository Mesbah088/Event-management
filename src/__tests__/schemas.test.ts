import { describe, it, expect } from 'vitest';
import {
  registrationSchema,
  eventSchema,
  checkInSchema,
  loginSchema,
  scannerCreateSchema,
} from '@/lib/validation/schemas';

describe('Zod Validation Schemas', () => {
  describe('registrationSchema', () => {
    it('accepts valid registration input', () => {
      const valid = {
        name: 'Jane Doe',
        email: 'JANE.DOE@Campus.Edu',
        phone: '+1 (555) 234-5678',
        studentId: 'ST-9912',
        department: 'Computer Science',
      };
      const result = registrationSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('jane.doe@campus.edu'); // Normalized lowercase
      }
    });

    it('rejects invalid email formats', () => {
      const invalid = {
        name: 'Jane Doe',
        email: 'not-an-email',
      };
      const result = registrationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects names that are too short', () => {
      const invalid = {
        name: 'J',
        email: 'jane@campus.edu',
      };
      const result = registrationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('accepts valid NITER student payload with batch and studentId', () => {
      const valid = {
        name: 'Md. Mesbah',
        email: 'mesbah@niter.edu.bd',
        phone: '01712345678',
        attendeeType: 'NITER_STUDENT',
        batch: '11th Batch',
        studentId: '2022-CSE-099',
        department: 'CSE',
      };
      const result = registrationSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.attendeeType).toBe('NITER_STUDENT');
        expect(result.data.studentId).toBe('2022-CSE-099');
        expect(result.data.batch).toBe('11th Batch');
      }
    });

    it('accepts valid External University student payload with institution', () => {
      const valid = {
        name: 'Karim Ahmed',
        email: 'karim@du.ac.bd',
        phone: '01812345678',
        attendeeType: 'EXTERNAL_STUDENT',
        institution: 'University of Dhaka',
        department: 'Computer Science',
      };
      const result = registrationSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.attendeeType).toBe('EXTERNAL_STUDENT');
        expect(result.data.institution).toBe('University of Dhaka');
      }
    });
  });

  describe('eventSchema', () => {
    it('accepts valid event parameters', () => {
      const valid = {
        title: 'Cybersecurity Workshop 2026',
        slug: 'cybersecurity-workshop-2026',
        description: 'Hands-on hardware and network security lab session.',
        organizer: 'InfoSec Society',
        venue: 'Engineering Building Lab 402',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3600000).toISOString(),
        registrationOpenAt: new Date().toISOString(),
        registrationCloseAt: new Date(Date.now() + 1800000).toISOString(),
        capacity: 150,
        status: 'PUBLISHED',
        gates: ['Lab Entrance'],
      };
      const result = eventSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid URL slug formats', () => {
      const invalid = {
        title: 'Cyber Workshop',
        slug: 'Cyber Workshop 2026!', // Uppercase, spaces, and punctuation forbidden
        description: 'Hands-on lab.',
        organizer: 'Club',
        venue: 'Room 1',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        registrationOpenAt: new Date().toISOString(),
        registrationCloseAt: new Date().toISOString(),
        capacity: 100,
        gates: ['Gate 1'],
      };
      const result = eventSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects negative or zero capacity', () => {
      const invalid = {
        title: 'Valid Title',
        slug: 'valid-slug',
        description: 'Valid long description for event.',
        organizer: 'Organizer',
        venue: 'Venue',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        registrationOpenAt: new Date().toISOString(),
        registrationCloseAt: new Date().toISOString(),
        capacity: 0,
        gates: ['Gate 1'],
      };
      const result = eventSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('checkInSchema', () => {
    it('accepts valid check-in parameters', () => {
      const valid = {
        token: 'valid_crypto_token_of_length_at_least_10_chars',
        eventId: '507f1f77bcf86cd799439011', // 24-char hex
        gateId: 'Main Gate',
      };
      const result = checkInSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects malformed eventId hex string', () => {
      const invalid = {
        token: 'valid_crypto_token_length',
        eventId: 'not-a-valid-object-id',
        gateId: 'Main Gate',
      };
      const result = checkInSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('rejects short passwords', () => {
      const invalid = {
        email: 'user@campus.edu',
        password: '123',
      };
      const result = loginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
