import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LedgerEntry from '../src/models/LedgerEntry.js';
import Finance from '../src/models/Finance.js';
import FeeTarget from '../src/models/FeeTarget.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const currentYear = new Date().getFullYear();

const run = async () => {
  if (!MONGO_URI) {
    console.error('MONGO_URI not defined in environment.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log(`Connected to MongoDB. Applying default year ${currentYear} to missing documents.`);

  const ledgerResult = await LedgerEntry.updateMany(
    { $or: [{ year: { $exists: false } }, { year: null }] },
    { $set: { year: currentYear } }
  );
  console.log(`LedgerEntry updated: ${ledgerResult.modifiedCount} document(s).`);

  const financeResult = await Finance.updateMany(
    { $or: [{ year: { $exists: false } }, { year: null }] },
    { $set: { year: currentYear } }
  );
  console.log(`Finance updated: ${financeResult.modifiedCount} document(s).`);

  const targetResult = await FeeTarget.updateMany(
    { $or: [{ year: { $exists: false } }, { year: null }] },
    { $set: { year: currentYear } }
  );
  console.log(`FeeTarget updated: ${targetResult.modifiedCount} document(s).`);

  await mongoose.disconnect();
  console.log('Migration complete.');
};

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
