const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Connecting to DB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB Atlas");
  } catch (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
