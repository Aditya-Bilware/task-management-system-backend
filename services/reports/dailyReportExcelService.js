const ExcelJs = require("exceljs");
const path = require("path");

const fs = require("fs");

const { applyWorksheetStyles } = require("../../utils/dailyReportExcelStyles");
const { getReportDate } = require("../../utils/reportDate");

const generateCompletedTaskReport = async (tasks) => {
  const today = new Date();

  const reportDate = getReportDate();

  const workbook = new ExcelJs.Workbook();

  workbook.creator = "Task Management System";

  const worksheet = workbook.addWorksheet("Completed Tasks");

  worksheet.mergeCells("A1:F1");
  worksheet.getCell("A1").value = "Task Management System";

  worksheet.mergeCells("A2:F2");
  worksheet.getCell("A2").value = `Daily Completed Task Report : ${reportDate}`;

  worksheet.getCell("A4").value = "Generated On";

  worksheet.getCell("B4").value = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  worksheet.getCell("A5").value = "Total Completed Tasks";

  worksheet.getCell("B5").value = tasks.length;

  if (tasks.length === 0) {
    worksheet.mergeCells("A8:G8");

    worksheet.getCell("A8").value =
      "No tasks were completed during this period.";

    worksheet.getCell("A8").alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    worksheet.getCell("A8").font = {
      italic: true,
      size: 12,
    };
  }

  worksheet.getRow(7).values = [
    "Task ID",
    "Title",
    "Description",
    "Assigned To",
    "Priority",
    "Created At",
    "Due Date",
    "Completed At",
  ];

  worksheet.columns = [
    { key: "taskId", width: 30 },
    { key: "title", width: 30 },
    { key: "description", width: 45 },
    { key: "assignedTo", width: 25 },
    { key: "priority", width: 18 },
    { key: "createdAt", width: 22 },
    { key: "dueDate", width: 22 },
    { key: "completedAt", width: 22 },
  ];

  tasks.forEach((task) => {
    worksheet.addRow({
      taskId: task.taskNumber,
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo?.name || "-",
      priority: task.priority,

      createdAt: task.createdAt
        ? new Date(task.createdAt).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "-",

      dueDate: task.dueDate
        ? new Date(task.dueDate).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "-",

      completedAt: task.completedAt
        ? new Date(task.completedAt).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-",
    });
  });

  applyWorksheetStyles(worksheet);

  const reportsDir = path.join(process.cwd(), "reports");

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filePath = path.join(reportsDir, `completed_tasks_${Date.now()}.xlsx`);

  await workbook.xlsx.writeFile(filePath);

  return filePath;
};

module.exports = {
  generateCompletedTaskReport,
};
