const express = require("express");
const router = express.Router();

const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getTaskById,
  getTaskHistory,
} = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");
const { getActivityLogs } = require("../controllers/activityController");

router.post("/", protect, createTask);
router.get("/", protect, getTasks);
router.get("/history", protect, getTaskHistory);
router.get("/:id", protect, getTaskById);
router.patch("/:id", protect, updateTask);
router.delete("/:id", protect, deleteTask);
router.get("/:id/activity", protect, getActivityLogs);

module.exports = router;
