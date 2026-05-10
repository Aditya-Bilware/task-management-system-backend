const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Connecting to DB...");
    // console.log(process.env.MONGO_URI);

    const conn = await mongoose.connect(process.env.MONGO_URI);
    serverSelectionTimeoutMS: 5000;

    // console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log("connected");
  } catch (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
