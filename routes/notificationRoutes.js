const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  // getRecentActivities,
  getNotifications,
  markNotificationRead,
  clearAllNotifications,
  getUnreadCount,
  deleteNotification,
} = require("../controllers/notificationController");
const router = express.Router();

// router.get("/recent-activities", protect, getRecentActivities);
router.get("/", protect, getNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.patch("/:id/read", protect, markNotificationRead);
router.patch("/clear-all", protect, clearAllNotifications);
router.delete("/:id", protect, deleteNotification);

module.exports = router;
