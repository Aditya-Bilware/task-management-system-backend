const dayjs = require("dayjs");

const { sendTaskEmail } = require("./emailService");

const sendTaskAssignmentMail = async (task) => {
  const dueDate = dayjs(task.dueDate).format("DD/MM/YYYY");

  try {
    const html = `
  <div style="font-family: Arial, sans-serif;">
        <h2>Task Management System </h2>

        <table
        border="1"
        cellpadding="8"
        cellspacing="0"
        style:"border-collapse : collapse; width:100%;"
        >
            <tr>
                <td><strong>Title</strong></td>
                <td>${task.title}</td>
            </tr>
            <tr>
                <td><strong>Status</strong></td>
                <td>${task.status}</td>
            </tr>
            <tr>
                <td><strong>Priority</strong></td>
                <td>${task.priority}</td>
            </tr>
            <tr>
                <td><strong>Assigned To</strong></td>
                <td>${task.assignedTo?.name}</td>
            </tr>
            <tr>
                <td><strong>Assigned By</strong></td>
                <td>${task.createdBy?.name}</td>
            </tr>
            <tr>
                <td><strong>Due Date</strong></td>
                <td>${task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) : "N/A"}</td>
            </tr>
        </table>
        <br>
        <h3>Description</h3>
            <p>
            The following are the feedback points identified during the first presentation review of the Task Management System.
            </p>
            <h4>Presentation Improvements</h3>
                <ol>
                    <li>Remove "Commercial in Confidence" from the slide footer and add the presentation date</li>
                    <li>Remove unnecessary spacing between words</li>
                    <li>Remove full stops from bullet points</li>
                    <li>Correct spelling and grammar issues</li>
                    <li>Maintain proper spacing between numbers and words</li>
                    <li>Use "and" before the last item in lists</li>
                    <li>Present clearly, calmly, and confidently</li>
                </ol>

            <h4>Application Improvements</h3>
                <ol>
                    <li>Either get approval to use the company logo or avoid using it</li>
                    <li>Add meaningful statistics to the Dashboard</li>
                    <li>Add an Edit Task button on the Task Detail page</li>
                    <li>Rename "Completed Tasks" page heading to "Task History"</li>
                    <li>Rename "Archived Tasks" to "Total Tasks"</li>
                    <li>Add an Employee filter to the Task History page</li>
                    <li>Change due date validation so past dates are not allowed</li>
                    <li>Allow employees to assign tasks to themselves</li>
                    <li>Conduct application testing with Aniket and Poonam and implement necessary improvements based on their feedback</li>
                </ol>
        <br>

        <p>Regards, <br>
        Task Management System</p>
        </div>
    `;

    const info = await sendTaskEmail(
      `[TMS] Task Summary - ${task.title}`,
      html,
    );
    console.log("Task summary mail send");
  } catch (err) {
    console.log("Error while sending task summary", err);
    throw err;
  }
};

module.exports = { sendTaskAssignmentMail };
