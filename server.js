const express = require("express");
require("dotenv").config();
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const { protect } = require("./middleware/authMiddleware");
const taskRoutes = require("./routes/taskRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");
// const reports = require("./jobs/dailyCompletedJobs.js");
// require("./jobs/taskSummaryJobs.js");
const cors = require("cors");
const mongoose = require("mongoose");

connectDB();
const app = express();

mongoose.connection.once("open", () => {
  console.log("DB Name:", mongoose.connection.name);
  console.log("DB Host:", mongoose.connection.host);
});

app.use(
  cors({
    // origin: ["http://localhost:5173"],
    origin: [process.env.FRONTEND_URL],
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API working");
});

app.get("/api/test", protect, (req, res) => {
  res.json({
    message: "Acccess granted",
    user: req.user,
  });
});
app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/tasks", taskRoutes);

app.use("/api/dashboard", dashboardRoutes);

// const host = "127.0.0.1";
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
