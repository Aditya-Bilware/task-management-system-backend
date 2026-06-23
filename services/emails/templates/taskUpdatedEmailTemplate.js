const baseTemplate = require("./baseTemplate");
const capitalizeFirstChar = require("../../../utils/capitalizeFirstChar");

const taskUpdatedTemplate = ({ task, activityLog, performedBy }) => {
  // const taskURL = `http://localhost:5173/tasks/${task._id}`;
  const taskURL = `https://nec-task-management-system.vercel.app/tasks/${task._id}`;

  const isDescriptionUpdated = activityLog.fieldChanged === "description";

  const fieldLabel = isDescriptionUpdated
    ? "Task description was updated"
    : capitalizeFirstChar(activityLog.fieldChanged);

  return {
    subject: `Task Updated - [${task.taskNumber}] ${task.title}`,

    html: baseTemplate({
      title: "Task Updated",

      content: `
        
        <p>
             <strong> ${performedBy?.name}</strong> made an update
             &nbsp; • ${
               task?.updatedAt
                 ? new Date(task?.updatedAt).toLocaleDateString("en-IN", {
                     timeZone: "Asia/Kolkata",
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
        <hr/>
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


        <div 
            style="
                background:#f9fafb;
                padding:16px;
                border-radius:8px;
                border:1px solid #e5e7eb;
        ">
            <div>
                <strong>Field Changed:</strong>
                <b>${fieldLabel}</b>
            </div>

           ${
             !isDescriptionUpdated
               ? `  <div>
                <strong>Old Value:</strong>
                <b>${capitalizeFirstChar(activityLog.oldValue)}</b>
            </div>

            <div>
                <strong>New Value:</strong>
                <b>${capitalizeFirstChar(activityLog.newValue)}</b>
            </div>`
               : ""
           }
        </div>

        <br/>

         <table width="100%">
            <tr>
                <td><b>Status</b></td>
                <td>${capitalizeFirstChar(task.status)}</td>
            </tr>

             <tr>
                <td><b>Priority</b></td>
                <td>${capitalizeFirstChar(task.priority)}</td>
            </tr>

            <tr>
                <td><b>Due Date</b></td>
                <td>${
                  task.dueDate
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

module.exports = taskUpdatedTemplate;
