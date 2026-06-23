const { transporter } = require("./emailService");

const notificationEmailService = async (subject, html) => {
  return transporter.sendMail({
    from: "NEC Software Solutions <adityabilware407@gmail.com>",
    to: [
      // "adityabilware407@gmail.com",
      // "aditya.bilware@necsws.com",
    ],
    subject,
    html,
  });
};

module.exports = { notificationEmailService };
