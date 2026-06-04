const cron = require("node-cron");
const Task = require("../models/Task");

const { sendTaskAssignmentMail } = require("../services/assignTaskService.js");

cron.schedule("15 9 * * *", async () => {
  console.log("Running task summary email job...");

  try {
    const task = await Task.findOne({
      title: "Review Feedback Points for Task Management System",
    })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (!task) {
      console.log("Feedback task not found");
      return;
    }

    await sendTaskAssignmentMail(task);
    console.log("task summary mail send successfully");
  } catch (err) {
    console.log("Task summary email failed..", err);
  }
});
