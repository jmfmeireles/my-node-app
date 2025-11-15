import { MongoClient }  from 'mongodb';

import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.ATLAS_URI;
let db;

// Only connect if not in test environment
if (process.env.NODE_ENV !== 'test') {
  if (!uri) {
      throw new Error('ATLAS_URI is not defined in the environment variables');
  }
  const client = new MongoClient(uri);

  let connection;

  try {
      connection = await client.connect();
  } catch(error){
      console.error(error);
  }

  db = connection?.db('sample_mflix');
}

export default db;
