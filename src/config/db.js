import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qpprkks.mongodb.net/?appName=Cluster0`;

// Module-level cached variables
let client = null;
let db = null;

export function getClient() {
  if (!client) {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      maxPoolSize: 10,
    });
  }
  return client;
}

export function getDB(dbName = 'chapterlyDB') {
  if (!db) {
    db = getClient().db(dbName);
  }
  return db;
}

// Collections reused across all incoming requests
export const booksCollection = getDB().collection('books');
export const commentsCollection = getDB().collection('comments');

// Clean connection close function for server shutdown/crashes
export async function closeDB() {
  if (client) {
    try {
      await client.close();
      console.log('MongoDB connection closed cleanly.');
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
    } finally {
      client = null;
      db = null;
    }
  }
}
