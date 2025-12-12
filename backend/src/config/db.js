require('dotenv').config();

const { MongoClient } = require('mongodb');

const client = new MongoClient(`${process.env.MONGODB_URI}`);

let db;

const connectDB = async () => {
    try {
        await client.connect();
        console.log("MongoDB connected");
        db = client.db("sample_analytics");
    }
    catch (err) {
        console.log("MongoDB connection error: ", err);
        process.exit(1);
    }
}

const getDB = () => {
    if (!db) {
        throw new Error("Database not connected");
    }
    return db;
}

module.exports = { connectDB, getDB };