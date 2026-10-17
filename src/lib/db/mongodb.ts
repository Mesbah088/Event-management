import { MongoClient, Db } from 'mongodb';
import dns from 'dns';
import { getInMemoryDb } from './in-memory-db';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in restricted environments
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient | null> | undefined;
}

export function getClientPromise(): Promise<MongoClient | null> {
  const currentUri = process.env.MONGODB_URI;
  const isPlaceholder =
    !currentUri ||
    currentUri.includes('<') ||
    currentUri.includes('>') ||
    !currentUri.startsWith('mongodb');

  if (isPlaceholder || !currentUri) {
    return Promise.resolve(null);
  }

  if (!global._mongoClientPromise) {
    try {
      const client = new MongoClient(currentUri, {
        maxPoolSize: 20,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
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

  return global._mongoClientPromise;
}

export async function getMongoClient(): Promise<MongoClient | null> {
  return await getClientPromise();
}

export async function getDb(): Promise<Db> {
  try {
    const connectedClient = await getClientPromise();
    if (connectedClient) {
      const dbName = process.env.MONGODB_DB_NAME || 'university_events';
      return connectedClient.db(dbName);
    }
  } catch (err: any) {
    console.warn('⚠️ MongoDB connection failed, using in-memory store:', err?.message);
  }

  // Zero-config resilient storage fallback
  return getInMemoryDb() as unknown as Db;
}

export default getClientPromise();

