const Notification = require("../models/Notification");
const getNotificationRecipeints = require("./getNotificationRecipients");

const createNotifications = async ({
  activityLogId,
  assignedTo,
  createdBy,
}) => {
  const uniqueRecipients = await getNotificationRecipeints({
    assignedTo,
    createdBy,
  });

  // console.log("Notification Recipients", uniqueRecipients);

  const notifications = uniqueRecipients.map((userId) => ({
    userId,
    activityLogId,
  }));

  await Notification.insertMany(notifications);
};

module.exports = createNotifications;
