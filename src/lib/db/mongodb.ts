import { MongoClient, Db } from 'mongodb';
import { getInMemoryDb } from './in-memory-db';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'university_events';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient | null> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient | null> | undefined;
}

if (uri) {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, {
      maxPoolSize: 20,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    global._mongoClientPromise = client.connect().catch((err) => {
      console.warn('⚠️ Could not connect to MongoDB, falling back to in-memory store:', err?.message);
      return null;
    });
  }
  clientPromise = global._mongoClientPromise;
}

export async function getMongoClient(): Promise<MongoClient | null> {
  return clientPromise ? await clientPromise : null;
}

export async function getDb(): Promise<Db> {
  if (clientPromise) {
    try {
      const connectedClient = await clientPromise;
      if (connectedClient) {
        return connectedClient.db(dbName);
      }
    } catch (err: any) {
      console.warn('⚠️ MongoDB connection failed, using in-memory store:', err?.message);
    }
  }

  // Zero-config resilient storage: runs directly on Vercel with zero external database requirements!
  return getInMemoryDb() as unknown as Db;
}

export default clientPromise;
