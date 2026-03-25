const mongoose = require("mongoose");

/**
 * Connects to MongoDB using the provided connection string.
 * @param {string} mongodbUri
 */
async function connectMongo(mongodbUri) {
  if (!mongodbUri) {
    throw new Error("MONGODB_URI is required to start the backend.");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongodbUri, {
    autoIndex: true
  });
}

module.exports = { connectMongo };
