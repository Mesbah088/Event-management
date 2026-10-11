import { describe, it, expect } from 'vitest';
import { getInMemoryDb } from '../lib/db/in-memory-db';

describe('InMemoryDb', () => {
  it('loads seeded event and users correctly', async () => {
    const db = getInMemoryDb();
    const event = await db.collection('events').findOne({ slug: 'niter-islamic-conference-2026' });
    expect(event).toBeDefined();
    expect(event?.title).toBe('NITER ISLAMIC Conference 2026');

    const admin = await db.collection('users').findOne({ email: 'admin@university.edu' });
    expect(admin).toBeDefined();
    expect(admin?.role).toBe('ADMIN');

    const events = await db.collection('events').find({ status: { $in: ['PUBLISHED', 'CLOSED'] } }).sort({ startDate: 1 }).toArray();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].title).toBe('NITER ISLAMIC Conference 2026');
  });
});
