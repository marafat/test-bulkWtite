const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'playground';

// Create a new MongoClient
const client = new MongoClient(url);

async function start() {
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection('users');

  await prepareTest(collection);

  await test(collection);

  await client.close();
}

(async () => {
  await start();
})();

async function prepareTest(collection) {
  await collection.createIndex({ email: 1 }, { unique: 1, background: false });

  await collection.updateOne(
    { email: 'adam@gmail.com' },
    { $set: { name: 'Adam Smith', age: 29 } },
    { upsert: true }
  );

  await collection.updateOne(
    { email: 'john@gmail.com' },
    { $set: { name: 'John Doe', age: 32 } },
    { upsert: true }
  );
}

async function test(collection) {
  const ops = [{
    updateOne: {
      filter: { email: 'adam@gmail.com' },
      update: { $set: { age: 39 } }
    }
  }, {
    insertOne: {
      document: {
        email: 'john@gmail.com'
      }
    }
  }];

  try {
    await collection.bulkWrite(ops, { ordered: false });
  } catch (err) {
    console.error('BulkWrite was expected to throw an error here!!');
  }

  // check if update succeeded
  const updatedAdam = await collection.findOne({ email: 'adam@gmail.com' });
  if (updatedAdam.age !== 39) {
    console.error(`UpdateOne operation did not run. Expected age: 39 and got: ${updatedAdam.age}`);
  }
}
