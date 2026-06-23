const baseTemplate = require("./baseTemplate");

const taskDeletedTemplate = ({ task, performedBy }) => {
  const taskURL = `http://localhost:5173/tasks/${task._id}`;

  return {
    subject: `Task Deleted - [${task.taskNumber}] ${task.title}`,

    html: baseTemplate({
      title: "Task Deleted",

      content: `
        <p>
            Task deleted by <strong> ${performedBy?.name}  </strong>
            &nbsp; • ${
              task?.deletedAt
                ? new Date(task.deletedAt).toLocaleDateString("en-IN", {
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
        `,
    }),
  };
};

module.exports = taskDeletedTemplate;
