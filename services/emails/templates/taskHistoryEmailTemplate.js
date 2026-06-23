const { reportDate } = require("../../../utils/reportDate");
const transporter = require("../emailService");

const sendCompletedTaskHistoryReportEmail = async (
  email,
  filePath,
  fromDate,
  toDate,
) => {
  try {
    fromDate = new Date(fromDate).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    toDate = new Date(toDate).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const info = await transporter.sendMail({
      from: `"Task Management System" <adityabilware407@gmail.com>`,
      to: email,
      subject: `Exported Completed Task Report | ${fromDate} - ${toDate} `,

      html: `
        <h2>Exported Completed Task Report </h2>

        <p>Your requested task history report has been generated successfully.</p>

        <table cellpadding="6">
            <tr>
                <td><strong>From</strong></td>
                <td>${fromDate}</td>
            </tr>
             <tr>
                <td><strong>To</strong></td>
                <td>${toDate}</td>
            </tr>
        </table>

        <p>Please find the attached report</p>

        <br/>

        <p>
            Regards, <br/>
            Task Management System
        </p>
    `,

      attachments: [
        {
          filename: `Exported_CompletedTasks_Report_${reportDate}.xlsx`,
          path: filePath,
        },
      ],
    });
    return info;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  sendCompletedTaskHistoryReportEmail,
};
