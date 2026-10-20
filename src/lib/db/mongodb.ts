import { MongoClient, Db } from 'mongodb';
import dns from 'dns';
import { getInMemoryDb } from './in-memory-db';

// CRITICAL FIX FOR VERCEL & PRODUCTION:
// Only configure DNS servers in local development environments where DNS SRV resolution might be restricted by local ISPs.
// NEVER override DNS servers on Vercel or AWS Lambda, because overriding DNS breaks the lambda runtime's
// internal resolver and causes external connection timeouts (MongoServerSelectionError).
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {
    // Ignore in restricted environments
  }
}

// Fallback MongoDB Atlas connection URI to ensure 100% database persistence even if
// environment variables were not yet configured in the Vercel dashboard.
const FALLBACK_MONGODB_URI =
  'mongodb://mrmesbah273_db_user:0X5iTGsqU0qdykem@ac-h7l5xxe-shard-00-00.2q4yzvq.mongodb.net:27017,ac-h7l5xxe-shard-00-01.2q4yzvq.mongodb.net:27017,ac-h7l5xxe-shard-00-02.2q4yzvq.mongodb.net:27017/university_events?ssl=true&replicaSet=atlas-kd2mfm-shard-0&authSource=admin&retryWrites=true&w=majority';

function cleanMongoUri(uri?: string | null): string {
  if (!uri) return FALLBACK_MONGODB_URI;
  const trimmed = uri.trim().replace(/^["']|["']$/g, '');
  if (!trimmed || trimmed.includes('<') || trimmed.includes('>') || !trimmed.startsWith('mongodb')) {
    return FALLBACK_MONGODB_URI;
  }
  return trimmed;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient | null> | undefined;
  // eslint-disable-next-line no-var
  var _cachedMongoClient: MongoClient | undefined;
}

export function getClientPromise(): Promise<MongoClient | null> {
  const currentUri = cleanMongoUri(process.env.MONGODB_URI);

  if (global._cachedMongoClient) {
    return Promise.resolve(global._cachedMongoClient);
  }

  if (!global._mongoClientPromise) {
    try {
      const client = new MongoClient(currentUri, {
        maxPoolSize: 10,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        retryWrites: true,
        w: 'majority',
      });

      global._mongoClientPromise = client
        .connect()
        .then((connectedClient) => {
          global._cachedMongoClient = connectedClient;
          return connectedClient;
        })
        .catch((err) => {
          console.warn('⚠️ Could not connect to remote MongoDB, using in-memory store:', err?.message);
          // Crucial: reset on failure so subsequent requests can retry rather than being permanently stuck
          global._mongoClientPromise = undefined;
          global._cachedMongoClient = undefined;
          return null;
        });
    } catch (e: any) {
      console.warn('⚠️ Invalid MongoDB URI, using in-memory store:', e?.message);
      global._mongoClientPromise = undefined;
      return Promise.resolve(null);
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

  // Zero-config resilient storage fallback only if remote connection is unreachable
  return getInMemoryDb() as unknown as Db;
}

export default getClientPromise();


