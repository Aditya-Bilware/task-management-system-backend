const Task = require("../models/Task");
const User = require("../models/User");

const fs = require("fs");

const {
  generateCompletedTaskHistoryReport,
} = require("../services/reports/taskHistoryExcelReportService");
const { reportDate } = require("../utils/reportDate");

const generateTaskHistoryReport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        message: "From Date and To Date are required",
      });
    }

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date format",
      });
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate > endDate) {
      return res.status(400).json({
        message: "From Date cannot be greater than To Date",
      });
    }

    if (startDate > today || endDate > today) {
      return res.status(400).json({
        message: "Future dates are not allowed",
      });
    }

    endDate.setHours(23, 59, 59, 999);

    let query = {
      status: "done",
      completedAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (req.user.role === "manager") {
      // manager can view all completed tasks
    } else if (req.user.role === "employee") {
      query.assignedTo = req.user.id;
    } else {
      return res.status(403).json({
        message: "Access Denied",
      });
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email employeeCode")
      .populate("createdBy", "name email employeeCode")
      .sort({ completedAt: -1 });

    if (!tasks.length) {
      return res.status(404).json({
        message: "No completed tasks found for the selected date range",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        message: "user not found",
      });
    }

    const filePath = await generateCompletedTaskHistoryReport(
      tasks,
      fromDate,
      toDate,
      user.name,
    );

    res.download(
      filePath,
      `CompletedTasks_Report_${reportDate}.xlsx`,
      (err) => {
        if (err) {
          console.log(err);
        }
        fs.unlink(filePath, () => {});
      },
    );
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Error in generating report",
    });
  }
};

module.exports = { generateTaskHistoryReport };
