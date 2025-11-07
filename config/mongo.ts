import { MongoClient }  from 'mongodb';

import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.ATLAS_URI;
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

const db = connection?.db('sample_mflix');
export default db;
