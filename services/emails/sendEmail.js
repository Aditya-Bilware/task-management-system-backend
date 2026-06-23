const transporter = require("./emailService");

const sendEmail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: "Task Management System <adityabilware407@gmail.com>",
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
