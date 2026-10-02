const mongoose = require('mongoose');

let memoryServer = null;

/**
 * Connect to MongoDB.
 * Connects to MongoDB Atlas if MONGODB_URI is provided.
 * Falls back to local MongoDB daemon or in-memory MongoDB.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log(`Connecting to MongoDB Atlas (database: lab-aggregator)...`);
      await mongoose.connect(uri.trim(), {
        dbName: 'lab-aggregator',
        serverSelectionTimeoutMS: 5000
      });
      console.log(`Connected to MongoDB Atlas (lab-aggregator) successfully.`);

      // Auto-seed if Atlas database is currently empty
      const LabItem = require('../models/LabItem');
      const seedData = require('../../seed/labItems.json');
      const count = await LabItem.countDocuments();
      if (count === 0) {
        console.log(`Atlas database empty. Auto-seeding initial lab items...`);
        await LabItem.insertMany(seedData);
        console.log(`Seeded ${seedData.length} lab items into MongoDB Atlas.`);
      }

      return mongoose.connection;
    } catch (err) {
      console.warn(`⚠️ Could not reach MongoDB Atlas (${err.message}). Falling back to local/in-memory instance so the app continues running without interruption.`);
    }
  }

  // Attempt local MongoDB daemon
  try {
    const localUri = 'mongodb://127.0.0.1:27017/labaggregator';
    console.log(`Attempting to connect to local MongoDB at ${localUri}...`);
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
    console.log(`Connected to local MongoDB daemon.`);
    return mongoose.connection;
  } catch (localErr) {
    console.log(`Local MongoDB daemon not detected. Starting in-memory MongoDB...`);
  }

  // Fallback to MongoMemoryServer
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memUri = memoryServer.getUri();
    console.log(`In-memory MongoDB started at: ${memUri}`);
    await mongoose.connect(memUri);
    console.log(`Connected to in-memory MongoDB.`);

    // Automatically seed in-memory database
    const LabItem = require('../models/LabItem');
    const seedData = require('../../seed/labItems.json');
    const count = await LabItem.countDocuments();
    if (count === 0) {
      await LabItem.insertMany(seedData);
      console.log(`In-memory database auto-seeded with ${seedData.length} lab items.`);
    }

    return mongoose.connection;
  } catch (memErr) {
    console.error(`Failed to start in-memory MongoDB: ${memErr.message}`);
    throw memErr;
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}

module.exports = { connectDB, disconnectDB };
