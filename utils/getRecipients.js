const getRecipients = (task) => {
  const recipients = [task.createdBy?.email, task.assignedTo?.email];

  return [...new Set(recipients.filter(Boolean))];
};

module.exports = getRecipients;
