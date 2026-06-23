const baseTemplate = require("./baseTemplate");
const capitalizeFirstChar = require("../../../utils/capitalizeFirstChar");

const taskCreatedTemplate = ({ task, performedBy }) => {
  const taskURL = `http://localhost:5173/tasks/${task._id}`;

  return {
    subject: `New task assigned - [${task.taskNumber}] ${task.title}`,

    html: baseTemplate({
      title: "Task Assigned",

      content: `

        <p>
            By <strong> ${performedBy?.name} </strong>
            &nbsp; • ${
              task.createdAt
                ? new Date(task.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                : "-"
            }  
        </p>
        <hr />
        <h2>
          <a
              href="${taskURL}"
              target="_blank"
              style="
                text-decoration:none !important;
              "
          >
              ${task?.title}
          </a>
        </h2>

        <table width="100%">
             <tr>
                <td><b>Task ID</b></td>
                <td>${task?.taskNumber}</td>
            </tr>

            <tr>
                <td><b>Assigned To</b></td>
                <td>${task.assignedTo?.name}</td>
            </tr>

             <tr>
                <td><b>Priority</b></td>
                <td>${capitalizeFirstChar(task?.priority)}</td>
            </tr>

             <tr>
                <td><b>Due Date</b></td>
                <td>${
                  task?.dueDate
                    ? new Date(task.dueDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"
                }</td>
            </tr>
        </table>
      
      `,
    }),
  };
};

module.exports = taskCreatedTemplate;

// <div style="margin-top:24px;">
//     <a
//       href="${taskURL}"
//       target="_blank"
//       style="
//         display:inline-block;
//         padding:12px 24px;
//         background:#2563eb;
//         color:#ffffff;
//         text-decoration:none;
//         border-radius:8px;
//         font-weight:600;
//       "
//     >
//       View Task
//     </a>
// </div>
