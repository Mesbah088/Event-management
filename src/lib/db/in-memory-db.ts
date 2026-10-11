import { ObjectId } from 'mongodb';

export class InMemoryCursor {
  private items: any[];

  constructor(items: any[]) {
    this.items = [...items];
  }

  sort(sortObj: Record<string, number>) {
    const keys = Object.keys(sortObj);
    if (keys.length === 0) return this;
    const [key, dir] = [keys[0], sortObj[keys[0]]];

    this.items.sort((a, b) => {
      const valA = a[key] instanceof Date ? a[key].getTime() : a[key];
      const valB = b[key] instanceof Date ? b[key].getTime() : b[key];
      if (valA < valB) return dir === 1 ? -1 : 1;
      if (valA > valB) return dir === 1 ? 1 : -1;
      return 0;
    });
    return this;
  }

  skip(n: number) {
    this.items = this.items.slice(n);
    return this;
  }

  limit(n: number) {
    this.items = this.items.slice(0, n);
    return this;
  }

  async toArray(): Promise<any[]> {
    return [...this.items];
  }
}

export class InMemoryCollection {
  name: string;
  docs: any[];

  constructor(name: string, initialDocs: any[] = []) {
    this.name = name;
    this.docs = [...initialDocs];
  }

  private matchDoc(doc: any, query: any): boolean {
    if (!query || Object.keys(query).length === 0) return true;

    for (const [key, expected] of Object.entries(query)) {
      if (key === '$or' && Array.isArray(expected)) {
        const matchesAny = expected.some((subQ) => this.matchDoc(doc, subQ));
        if (!matchesAny) return false;
        continue;
      }

      const actual = doc[key];

      // Handle ObjectId equality
      if (expected instanceof ObjectId || (expected && (expected as any)._bsontype === 'ObjectID')) {
        if (!actual || actual.toString() !== expected.toString()) return false;
        continue;
      }

      if (key === '_id' && typeof expected === 'string') {
        if (!actual || actual.toString() !== expected) return false;
        continue;
      }

      // Handle operators like $in
      if (expected && typeof expected === 'object' && '$in' in (expected as any)) {
        const inList = (expected as any).$in;
        if (Array.isArray(inList) && !inList.includes(actual)) {
          return false;
        }
        continue;
      }

      // Direct value comparison
      if (actual !== expected) {
        return false;
      }
    }

    return true;
  }

  async findOne(query: any = {}): Promise<any | null> {
    const found = this.docs.find((d) => this.matchDoc(d, query));
    return found ? JSON.parse(JSON.stringify(found), (k, v) => (k === '_id' ? new ObjectId(v) : k.endsWith('At') || k.endsWith('Date') ? new Date(v) : v)) : null;
  }

  find(query: any = {}): InMemoryCursor {
    const matched = this.docs.filter((d) => this.matchDoc(d, query));
    const cloned = matched.map((d) =>
      JSON.parse(JSON.stringify(d), (k, v) => (k === '_id' ? new ObjectId(v) : k.endsWith('At') || k.endsWith('Date') ? new Date(v) : v))
    );
    return new InMemoryCursor(cloned);
  }

  async insertOne(doc: any): Promise<{ insertedId: ObjectId }> {
    const newDoc = { ...doc };
    if (!newDoc._id) {
      newDoc._id = new ObjectId();
    }
    if (!newDoc.createdAt) newDoc.createdAt = new Date();
    if (!newDoc.updatedAt) newDoc.updatedAt = new Date();

    this.docs.push(newDoc);
    return { insertedId: newDoc._id };
  }

  async updateOne(query: any, update: any, options: any = {}): Promise<{ modifiedCount: number; matchedCount: number; upsertedId?: ObjectId }> {
    let index = this.docs.findIndex((d) => this.matchDoc(d, query));

    if (index === -1) {
      if (options.upsert) {
        const newDoc = {
          ...query,
          ...(update.$set || {}),
          _id: new ObjectId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.docs.push(newDoc);
        return { modifiedCount: 1, matchedCount: 0, upsertedId: newDoc._id };
      }
      return { modifiedCount: 0, matchedCount: 0 };
    }

    const doc = this.docs[index];
    if (update.$set) {
      Object.assign(doc, update.$set);
    }
    if (update.$inc) {
      for (const [k, v] of Object.entries(update.$inc)) {
        doc[k] = (doc[k] || 0) + (v as number);
      }
    }
    doc.updatedAt = new Date();
    return { modifiedCount: 1, matchedCount: 1 };
  }

  async findOneAndUpdate(query: any, update: any, options: any = {}): Promise<any | null> {
    const index = this.docs.findIndex((d) => this.matchDoc(d, query));
    if (index === -1) return null;

    const doc = this.docs[index];
    if (update.$set) {
      Object.assign(doc, update.$set);
    }
    if (update.$inc) {
      for (const [k, v] of Object.entries(update.$inc)) {
        doc[k] = (doc[k] || 0) + (v as number);
      }
    }
    doc.updatedAt = new Date();
    return JSON.parse(JSON.stringify(doc), (k, v) => (k === '_id' ? new ObjectId(v) : k.endsWith('At') || k.endsWith('Date') ? new Date(v) : v));
  }

  async countDocuments(query: any = {}): Promise<number> {
    return this.docs.filter((d) => this.matchDoc(d, query)).length;
  }

  async createIndex(spec: any, options: any = {}): Promise<string> {
    return 'in_memory_index';
  }

  aggregate(pipeline: any[]): InMemoryCursor {
    let result = [...this.docs];
    for (const stage of pipeline) {
      if (stage.$group) {
        const groupKey = stage.$group._id.replace('$', '');
        const map = new Map<string, number>();
        for (const doc of result) {
          const keyVal = doc[groupKey]?.toString() || 'unknown';
          map.set(keyVal, (map.get(keyVal) || 0) + 1);
        }
        result = Array.from(map.entries()).map(([k, count]) => ({ _id: k, count }));
      }
    }
    return new InMemoryCursor(result);
  }
}

export class InMemoryDb {
  private collections: Map<string, InMemoryCollection> = new Map();

  constructor() {
    this.initSeedData();
  }

  private initSeedData() {
    const now = new Date();

    // 1. Initial Admin & Scanner
    const users = [
      {
        _id: new ObjectId('661a00000000000000000001'),
        name: 'System Administrator',
        email: 'admin@university.edu',
        passwordHash: '$2b$10$T3035Nu21kzC0hZfRPauq.c5tC2J6t65NgWV4MA3NdYGrpL1dElgm', // Admin1234!
        role: 'ADMIN',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: new ObjectId('661a00000000000000000002'),
        name: 'Gate Scanner Staff',
        email: 'scanner@university.edu',
        passwordHash: '$2b$10$odc0f.rwN2yo8xM12dfxTucgx6UpmPXUxWp6hD9ksvpS1iNdFzkvq', // Scanner1234!
        role: 'SCANNER',
        isActive: true,
        defaultGate: 'Main Auditorium Gate',
        assignedEventIds: [new ObjectId('661a00000000000000000010')],
        createdAt: now,
        updatedAt: now,
      },
    ];

    // 2. NITER ISLAMIC Conference 2026 Event
    const events = [
      {
        _id: new ObjectId('661a00000000000000000010'),
        slug: 'niter-islamic-conference-2026',
        title: 'NITER ISLAMIC Conference 2026',
        description:
          'The premier campus gathering for Islamic knowledge, ethics, leadership, and youth empowerment. Organized at NITER with respected scholars, keynote talks, interactive Q&A sessions, and communal luncheon.',
        organizer: 'NITER Islamic Society',
        venue: 'NITER Central Auditorium & Campus Complex, Nayarhat, Savar, Dhaka',
        startDate: new Date(now.getTime() + 5 * 24 * 3600 * 1000),
        endDate: new Date(now.getTime() + 6 * 24 * 3600 * 1000),
        registrationOpenAt: new Date(now.getTime() - 24 * 3600 * 1000),
        registrationCloseAt: new Date(now.getTime() + 4 * 24 * 3600 * 1000),
        capacity: 1500,
        registeredCount: 0,
        status: 'PUBLISHED',
        gates: ['Main Auditorium Gate', 'East Academic Gate', 'VIP & Guest Gate'],
        createdAt: now,
        updatedAt: now,
      },
    ];

    this.collections.set('users', new InMemoryCollection('users', users));
    this.collections.set('events', new InMemoryCollection('events', events));
    this.collections.set('registrations', new InMemoryCollection('registrations', []));
    this.collections.set('scanLogs', new InMemoryCollection('scanLogs', []));
    this.collections.set('emailLogs', new InMemoryCollection('emailLogs', []));
    this.collections.set('auditLogs', new InMemoryCollection('auditLogs', []));
  }

  collection(name: string): InMemoryCollection {
    if (!this.collections.has(name)) {
      this.collections.set(name, new InMemoryCollection(name, []));
    }
    return this.collections.get(name)!;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var _globalInMemoryDb: InMemoryDb | undefined;
}

export function getInMemoryDb(): InMemoryDb {
  if (!global._globalInMemoryDb) {
    global._globalInMemoryDb = new InMemoryDb();
  }
  return global._globalInMemoryDb;
}
