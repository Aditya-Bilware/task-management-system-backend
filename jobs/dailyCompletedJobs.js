const cron = require("node-cron");
const {
  generateCompletedTaskReport,
} = require("../services/reports/dailyReportExcelService.js");
const Task = require("../models/Task.js");
const {
  sendDailyReportEmail,
} = require("../services/emails/dailyReportEmailService.js");

cron.schedule(
  "0 3 * * 1-5",
  async () => {
    console.log("Running daily report job...");
    const fs = require("fs");

    try {
      const startDate = new Date();
      const endDate = new Date();

      const day = startDate.getDay();
      if (day === 1) {
        startDate.setDate(startDate.getDate() - 3);
        endDate.setDate(endDate.getDate() - 3);
      } else {
        startDate.setDate(startDate.getDate());
        endDate.setDate(endDate.getDate());
      }

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const tasks = await Task.find({
        status: "done",
        completedAt: {
          $gte: startDate,
          $lte: endDate,
        },
      }).populate("assignedTo", "name");

      const filePath = await generateCompletedTaskReport(tasks);

      await sendDailyReportEmail(filePath);

      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      console.log("Email send successfully");
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  },
  {
    timezone: "Asia/Kolkata",
  },
);
