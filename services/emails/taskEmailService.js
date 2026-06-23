const User = require("../../models/User");

const getRecipients = require("../../utils/getRecipients");
const taskCreatedTemplate = require("./templates/taskCreatedEmailTemplate");
const taskUpdatedTemplate = require("./templates/taskUpdatedEmailTemplate");
const taskDeletedTemplate = require("./templates/taskDeletedEmailTemplate");

const sendEmail = require("../emails/sendEmail");

const sendTaskEmails = async ({ activityLog, task }) => {
  const recipients = getRecipients(task);

  const performedBy = await User.findById(activityLog.performedBy).select(
    "name email",
  );

  // console.log(performedBy);
  let emailData;

  switch (activityLog.action) {
    case "created":
      emailData = taskCreatedTemplate({ task, performedBy });
      break;
    case "updated":
      emailData = taskUpdatedTemplate({ task, activityLog, performedBy });

      break;
    case "deleted":
      emailData = taskDeletedTemplate({ task, performedBy });
      break;
    default:
      return;
  }

  if (!emailData) return;

  try {
    await sendEmail({
      to: recipients,
      subject: emailData.subject,
      html: emailData.html,
    });
    console.log("email sent");
  } catch (err) {
    console.log("email failed", err);
  }
};

module.exports = sendTaskEmails;
