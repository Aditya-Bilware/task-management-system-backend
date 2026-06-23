const sendTaskEmails = require("../services/emails/taskEmailService");
const createNotifications = require("./createNotification");

const handleTaskActivity = async ({ activityLog, task }) => {
  const notificationPromise = createNotifications({
    activityLogId: activityLog.id,

    assignedTo: task.assignedTo,

    createdBy: task.createdBy,
  });

  const emailPromise = sendTaskEmails({
    activityLog,
    task,
  });

  await Promise.allSettled([notificationPromise, emailPromise]);
};

module.exports = handleTaskActivity;
