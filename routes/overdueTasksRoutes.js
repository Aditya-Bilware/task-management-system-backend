const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getOverdueTasks,
  getOverdueTasksCount,
} = require("../controllers/overdueTasksController");

const router = express.Router();

router.get("/", protect, getOverdueTasks);
router.get("/count", protect, getOverdueTasksCount);
module.exports = router;
