const User = require("../models/User");

const getNotificationRecipeints = async ({ assignedTo, createdBy }) => {
  const assignedUserId = assignedTo?._id || assignedTo;

  const creatorUserId = createdBy?._id || createdBy;

  const recipients = new Set();

  if (assignedUserId) {
    recipients.add(assignedUserId.toString());
  }

  if (creatorUserId) {
    recipients.add(creatorUserId.toString());
  }

  const creator = await User.findById(creatorUserId).select("role");

  if (creator?.role === "employee") {
    const managers = await User.find({ role: "manager" }, "_id");

    managers.forEach((manager) => {
      recipients.add(manager._id.toString());
    });
  }

  return [...recipients];
};

module.exports = getNotificationRecipeints;
