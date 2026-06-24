const mongoose = require("mongoose");

const Task = require("../models/Task");
const TaskActivityLog = require("../models/TaskActivityLog");

const { normalizeDate } = require("../utils/normalizedDate");
const { getStartOfTodayIST } = require("../utils/startOfToday");

const getOverdueTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const limit = parseInt(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    const today = getStartOfTodayIST();

    console.log("TODAY:", today.toISOString());

    const tasks = await Task.find({
      status: {
        $nin: ["done", "rejected"],
      },
    })
      .select("taskNumber dueDate")
      .lean();

    tasks.forEach((task) => {
      console.log(
        task.taskNumber,
        task.dueDate?.toISOString(),
        task.dueDate < today,
      );
    });

    const filter = {
      isDeleted: false,

      dueDate: {
        $exists: true,
        $ne: null,
        $lt: today,
      },

      status: {
        $nin: ["done", "rejected"],
      },
    };

    if (req.user.role === "manager") {
    } else if (req.user.role === "employee") {
      filter.assignedTo = req.user.id;
    } else {
      return res.status(403).json({
        message: "Access Denied",
      });
    }

    const totalOverdueTasks = await Task.countDocuments(filter);

    const overdueTasks = await Task.find(filter)
      .select("title taskNumber dueDate priority status createdBy assignedTo")
      .populate("createdBy", "name role")
      .populate("assignedTo", "name role")
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return res.status(200).json({
      message: "overdue tasks fetched successfully",
      overdueTasks,

      pagination: {
        totalOverdueTasks,
        page,
        totalPages: Math.ceil(totalOverdueTasks / limit),
        limit,
        hasNextPage: page * limit < totalOverdueTasks,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const getOverdueTasksCount = async (req, res) => {
  try {
    const today = getStartOfTodayIST();

    const filter = {
      isDeleted: false,

      dueDate: {
        $exists: true,
        $ne: null,
        $lt: today,
      },

      status: {
        $nin: ["done", "rejected"],
      },
    };

    if (req.user.role === "manager") {
    } else if (req.user.role === "employee") {
      filter.assignedTo = req.user.id;
    } else {
      return res.status(403).json({
        message: "Access Denied",
      });
    }

    const count = await Task.countDocuments(filter);

    return res.status(200).json({
      message: "overdue tasks count",
      count,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = { getOverdueTasks, getOverdueTasksCount };
