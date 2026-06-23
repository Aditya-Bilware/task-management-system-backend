const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  generateTaskHistoryReport,
} = require("../controllers/reportController");
const router = express.Router();

router.post("/task-history", protect, generateTaskHistoryReport);

module.exports = router;
