import { ObjectId } from 'mongodb';
import clientPromise from './mongodb';

export type DbJob = {
  _id?: ObjectId;
  title: string;
  company: string;
  location: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DbUser = {
  _id?: ObjectId;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

// Database and collections names
const DB_NAME = 'jobx';
const COLLECTIONS = {
  JOBS: 'jobs',
  USERS: 'users',
} as const;

// Generic database operations
export async function getCollection(collectionName: string) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return db.collection(collectionName);
}

// Job operations
export async function getJobs(query = {}, options = {}) {
  const collection = await getCollection(COLLECTIONS.JOBS);
  return collection.find(query, options).toArray();
}

export async function getJobById(id: string) {
  const collection = await getCollection(COLLECTIONS.JOBS);
  return collection.findOne({ _id: new ObjectId(id) });
}

export async function createJob(jobData: Omit<DbJob, '_id' | 'createdAt' | 'updatedAt'>) {
  const collection = await getCollection(COLLECTIONS.JOBS);
  const now = new Date();
  
  const result = await collection.insertOne({
    ...jobData,
    createdAt: now,
    updatedAt: now,
  });

  return result;
}

export async function updateJob(id: string, jobData: Partial<DbJob>) {
  const collection = await getCollection(COLLECTIONS.JOBS);
  
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { 
      $set: {
        ...jobData,
        updatedAt: new Date(),
      }
    },
    { returnDocument: 'after' }
  );

  return result;
}

export async function deleteJob(id: string) {
  const collection = await getCollection(COLLECTIONS.JOBS);
  return collection.deleteOne({ _id: new ObjectId(id) });
}

// User operations
export async function getUserByEmail(email: string) {
  const collection = await getCollection(COLLECTIONS.USERS);
  return collection.findOne({ email });
}

export async function createUser(userData: Omit<DbUser, '_id' | 'createdAt' | 'updatedAt'>) {
  const collection = await getCollection(COLLECTIONS.USERS);
  const now = new Date();
  
  const result = await collection.insertOne({
    ...userData,
    createdAt: now,
    updatedAt: now,
  });

  return result;
}

// Initialize database indexes
export async function createIndexes() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  // Create indexes for jobs collection
  await db.collection(COLLECTIONS.JOBS).createIndexes([
    { key: { title: 'text', company: 'text', description: 'text' } },
    { key: { createdAt: -1 } },
  ]);

  // Create indexes for users collection
  await db.collection(COLLECTIONS.USERS).createIndexes([
    { key: { email: 1 }, unique: true },
    { key: { createdAt: -1 } },
  ]);
}
