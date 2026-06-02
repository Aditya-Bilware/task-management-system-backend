const { mongoose } = require("mongoose");
const Task = require("../models/Task");
const User = require("../models/User");
const TaskActivityLog = require("../models/TaskActivityLog");

const getActivityLogs = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid Task ID",
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not exists",
      });
    }

    if (req.user.role === "manager") {
    } else if (req.user.role === "employee") {
      if (task.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else {
      return res.status(403).json({
        message: "Invalid role",
      });
    }

    const logs = await TaskActivityLog.find({
      taskId: req.params.id,
    })
      .populate("performedBy", "employeeCode name email ")
      .sort({ createdAt: -1 })
      .select("-__v")
      .lean();

    return res.status(200).json({
      message: "Activity logs fetched successfully",
      totalLogs: logs.length,
      logs,
    });
  } catch (err) {
    console.log("get activity logs error", err);
    return res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = { getActivityLogs };
