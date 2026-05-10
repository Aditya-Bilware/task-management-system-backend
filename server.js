const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const { protect } = require("./middleware/authMiddleware");
const taskRoutes = require("./routes/taskRoutes");

dotenv.config();
connectDB();
const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API working");
});

app.get("/api/test", protect, (req, res) => {
  res.json({
    message: "Acccess granted",
    user: req.user,
  });
});

app.use("/api/tasks", taskRoutes);

const host = "127.0.0.1";
const port = process.env.PORT || 3000;
app.listen(port, host, () => {
  console.log(`server is running on http://${host}:${port}`);
});
