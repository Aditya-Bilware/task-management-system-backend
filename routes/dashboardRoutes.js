const express = require("express");
const router = express.Router();

const {
  getStats,
  getRecentTasks,
} = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");

router.get("/stats", protect, getStats);
router.get("/recent-tasks", protect, getRecentTasks);

module.exports = router;
