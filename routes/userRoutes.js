const express = require("express");
const {
  getEmployees,
  getEmployeesStats,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/employees", protect, getEmployees);
router.get("/employees/stats", protect, getEmployeesStats);

module.exports = router;
