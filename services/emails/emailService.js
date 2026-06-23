const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  // // local
  // service: "gmail",
  // auth: {
  //   user: process.env.SMTP_EMAIL,
  //   pass: process.env.SMTP_PASSWORD,
  // },

  // Render

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

module.exports = transporter;
