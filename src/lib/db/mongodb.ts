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

const isPlaceholder = !uri || uri.includes('<') || uri.includes('>') || !uri.startsWith('mongodb');

if (!isPlaceholder && uri) {
  if (!global._mongoClientPromise) {
    try {
      client = new MongoClient(uri, {
        maxPoolSize: 20,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 1500,
        connectTimeoutMS: 1500,
      });
      global._mongoClientPromise = client.connect().catch((err) => {
        console.warn('⚠️ Could not connect to remote MongoDB, using in-memory store:', err?.message);
        return null;
      });
    } catch (e: any) {
      console.warn('⚠️ Invalid MongoDB URI, using in-memory store:', e?.message);
      global._mongoClientPromise = Promise.resolve(null);
    }
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
