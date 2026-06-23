const mongoose = require("mongoose");

const Task = require("../models/Task");
const TaskActivityLog = require("../models/TaskActivityLog");

const Notification = require("../models/Notification");

const { normalizeDate } = require("../utils/normalizedDate");

const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const limit = parseInt(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    if (page < 1) {
      return res.status(400).json({
        message: "Page must be greater than 0",
      });
    }

    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        message: "limit must be between 1 and 50",
      });
    }

    const filter = {
      userId: req.user.id,
      isRead: false,
      cleared: false,
    };

    const totalNotifications = await Notification.countDocuments(filter);

    const notifications = await Notification.find(filter)
      .populate({
        path: "activityLogId",
        populate: [
          {
            path: "taskId",
            select: "title taskNumber",
          },
          {
            path: "performedBy",
            select: "name",
          },
        ],
      })
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean();

    const validNotifications = notifications.filter((n) => n.activityLogId);

    return res.status(200).json({
      notifications: validNotifications,
      pagination: {
        totalNotifications,
        page,
        totalPages: Math.ceil(totalNotifications / limit),
        limit,
        hasNextPage: page * limit < totalNotifications,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
      cleared: false,
    });

    return res.status(200).json({
      count,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid Notification Id",
      });
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    if (notification.isRead) {
      return res.status(200).json({
        message: "Notification already read",
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();

    await notification.save();

    return res.status(200).json({
      message: "Notification marked as read",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const clearAllNotifications = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        userId: req.user.id,
        isRead: false,
        cleared: false,
      },
      {
        cleared: true,
        clearedAt: new Date(),
      },
    );

    return res.status(200).json({
      message: "Notifications cleared",
      count: result.modifiedCount,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid Notification Id",
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      message: "Notification deleted",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  clearAllNotifications,
  deleteNotification,
};
