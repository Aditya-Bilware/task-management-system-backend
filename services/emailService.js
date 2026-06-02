const nodemailer = require("nodemailer");

const reportDate = new Date()
  .toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  .replace(/\//g, "-");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log("SMTP Error:", error);
  } else {
    console.log("SMTP Ready");
  }
});

const sendReportEmail = async (filePath) => {
  await transporter.sendMail({
    from: process.env.SMTP_EMAIL,
    to: [
      "adityabilware407@gmail.com",
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
};

module.exports = { sendReportEmail };
