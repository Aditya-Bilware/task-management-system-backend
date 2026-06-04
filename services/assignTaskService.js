const { transporter } = require("./emailService");

const sendTaskAssignmentMail = async (task) => {
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
                <td>${task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-IN") : "N/A"}</td>
            </tr>
        </table>
        <br>
        <h3>Description</h3>
        <p>${task.description}</p>
        <br>

        <p>Regards, <br>
        Aditya</p>
        </div>
    `;

    const info = await transporter.sendMail({
      from: "NEC Software Solutions <adityabilware407@gmail.com>",
      to: ["adityabilware407@gmai.com", "aditya.bilware@necsws.com"],
      subject: `[TMS] Task Summary - ${task.title}`,
      html,
    });
    console.log("Task summary mail send");
  } catch (err) {
    console.log("Error while sending task summary", err);
  }
};

module.exports = { sendTaskAssignmentMail };
