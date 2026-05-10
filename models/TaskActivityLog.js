const mongoose = require("mongoose");
const Task = require("./Task");

const taskActivityLogSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    action: {
      type: String,
      enum: ["created", "updated", "deleted", "restored"],
      required: true,
    },
    fieldChanged: {
      type: String,
      default: null,
    },

    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    performedBy: {
      type: mongoose.Schema.Types.Mixed,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("TaskActivityLog", taskActivityLogSchema);
