const { reportDate } = require("../../utils/reportDate");
const transporter = require("./emailService");

const sendDailyReportEmail = async (filePath) => {
  const info = await transporter.sendMail({
    from: "Task Management System <adityabilware407@gmail.com>",
    to: [
      // "adityabilware407@gmail.com",
      "aditya.bilware@necsws.com",
      // "shubham.khuje@necsws.com",
    ],
    subject: `Tast Completion Daily Report : ${reportDate}`,
    text: "Please find attached the report for today's completed tasks",
    attachments: [
      {
        filename: `CompletedTasks_Report_${reportDate}.xlsx`,
        path: filePath,
      },
    ],
  });

  // console.log("MAIL INFO:", info);
};

module.exports = { sendDailyReportEmail };
