require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { connectDB, disconnectDB } = require('../src/config/db');
const LabItem = require('../src/models/LabItem');
const labItemsData = require('./labItems.json');

async function seed() {
  try {
    console.log('--- Starting Lab Items Database Seeding ---');
    await connectDB();

    console.log('Clearing existing LabItem records...');
    const deleted = await LabItem.deleteMany({});
    console.log(`Removed ${deleted.deletedCount} existing records.`);

    console.log(`Inserting ${labItemsData.length} seeded lab items...`);
    const inserted = await LabItem.insertMany(labItemsData);
    console.log(`Successfully seeded ${inserted.length} lab items into MongoDB.`);

    console.log('--- Seeding Completed Successfully ---');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
}

seed();
