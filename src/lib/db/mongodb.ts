import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/university_events';
const dbName = process.env.MONGODB_DB_NAME || 'university_events';

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ Warning: MONGODB_URI is not set. Please add MONGODB_URI in Vercel project settings.');
  }

  client = new MongoClient(uri, {
    maxPoolSize: 20,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
  });
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
    throw new Error('Database configuration missing: MONGODB_URI is not set in Vercel environment variables.');
  }
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}

export default clientPromise;
