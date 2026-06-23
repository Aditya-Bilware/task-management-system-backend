const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    activityLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskActivityLog",
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    cleared: {
      type: Boolean,
      default: false,
      index: true,
    },
    clearedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({
  userId: 1,
  isRead: 1,
  cleared: 1,
  createdAt: -1,
});
module.exports = mongoose.model("Notification", notificationSchema);
