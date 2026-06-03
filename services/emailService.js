const nodemailer = require("nodemailer");

const reportDate = new Date()
  .toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  .replace(/\//g, "-");

console.log("SMTP_EMAIL:", process.env.SMTP_EMAIL);
console.log("SMTP_PASSWORD exists:", !!process.env.SMTP_PASSWORD);
console.log("Using Brevo SMTP");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 2525,
  secure: false,
  requireTLS: true,
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
  const info = await transporter.sendMail({
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
  console.log("MAIL INFO:", info);
};

module.exports = { sendReportEmail };
