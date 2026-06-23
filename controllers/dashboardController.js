const Task = require("../models/Task");
const TaskActivityLog = require("../models/TaskActivityLog");
const { normalizeDate } = require("../utils/normalizedDate");

const getStats = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === "manager") {
      filter = {
        isDeleted: false,
      };
    } else if (req.user.role === "employee") {
      filter = {
        assignedTo: req.user.id,
        isDeleted: false,
      };
    } else {
      return res.status(403).json({
        message: "Invalid role",
      });
    }

    const totalTasks = await Task.countDocuments(filter);

    const activeTasks = await Task.countDocuments({
      ...filter,
      status: {
        $in: ["in-progress", "next"],
      },
    });

    const overdueTasks = await Task.countDocuments({
      ...filter,
      dueDate: {
        $lt: normalizeDate(new Date()),
      },
      status: {
        $nin: ["done", "rejected"],
      },
    });

    const criticalTasks = await Task.countDocuments({
      ...filter,
      priority: "critical",
      status: {
        $nin: ["done", "rejected"],
      },
    });

    const completedTasks = await Task.countDocuments({
      ...filter,
      status: "done",
    });

    return res.status(200).json({
      message: "Stats fetched successfully",

      stats: {
        totalTasks,
        activeTasks,
        overdueTasks,
        criticalTasks,
        completedTasks,
      },
    });
  } catch (err) {
    console.log("get stats error", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

const getRecentTasks = async (req, res) => {
  try {
    let filter = {
      isDeleted: false,
    };

    if (req.user.role === "manager") {
      filter = {
        isDeleted: false,
      };
    } else if (req.user.role === "employee") {
      filter = {
        assignedTo: req.user.id,
        isDeleted: false,
      };
    } else {
      return res.status(403).json({
        message: "Access Denied",
      });
    }

    const recentTasks = await Task.find(filter)
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate("assignedTo", "name")
      .populate("createdBy", "employeeCode name email")
      .select("-deletedBy -createdAt -updatedAt -__v -deletedAt -isDeleted")
      .lean();

    return res.status(200).json({
      message: "Recent tasks fetched successfully",
      recentTasks,
    });
  } catch (err) {
    console.log("get recent tasks error", err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = { getStats, getRecentTasks };
