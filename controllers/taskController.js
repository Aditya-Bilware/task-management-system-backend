const { mongoose } = require("mongoose");
const Task = require("../models/Task");
const User = require("../models/User");
const TaskActivityLog = require("../models/TaskActivityLog");

const allowedStatuses = Task.schema.path("status").enumValues;
const allowedPriorities = Task.schema.path("priority").enumValues;

const createTask = async (req, res) => {
  try {
    let { title, description, priority, assignedTo, dueDate } = req.body;

    if (req.user.role !== "manager") {
      return res.status(403).json({ message: "Only manager can create tasks" });
    }

    if (
      typeof title !== "string" ||
      (description && typeof description !== "string")
    ) {
      return res.status(400).json({
        message: "Invalid input type",
      });
    }

    title = title.trim().replace(/\s+/g, " ");
    description = description?.trim().replace(/\s+/g, " ") || "";

    if (!title || !assignedTo || !priority) {
      return res.status(400).json({
        message: "Required fileds are missing",
      });
    }

    // min title length
    if (title.length < 3) {
      res.status(400).json({
        message: "Title is too short",
      });
    }

    // max title length
    if (title.length > 100) {
      res.status(400).json({
        message: "Title is too long",
      });
    }

    // Invalid user ID
    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({
        message: "Invalid assigned user ID",
      });
    }

    // user not exists
    const userExists = await User.findById(assignedTo);

    if (!userExists) {
      return res.status(404).json({
        message: "Assigned user not found",
      });
    }

    // Invalid priority value
    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        message: "Invalid priority value",
      });
    }

    // Invalid dueDate
    if (dueDate) {
      const taskDueDate = new Date(dueDate);

      if (isNaN(taskDueDate.getTime())) {
        return res.status(400).json({
          message: "Invalid due date",
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      taskDueDate.setHours(0, 0, 0, 0);

      if (taskDueDate < today) {
        return res.status(400).json({
          message: "Due date can not be in the past",
        });
      }
    }

    // task already exists
    const existingTask = await Task.exists({
      title: new RegExp(`^${title.trim().replace(/\s+/g, " ")}$`, "i"),
      assignedTo,
      isDeleted: false,
      status: {
        $nin: ["done", "rejected"],
      },
    });

    if (existingTask) {
      return res.status(400).json({
        message: "Task exists",
      });
    }

    // create task if all conditions pass
    const task = await Task.create({
      title,
      description,
      status: "next",
      priority: priority || "minor",
      assignedTo,
      dueDate,
      createdBy: req.user.id,
    });
    console.log("task created");

    // Activity log for task created

    await TaskActivityLog.create({
      taskId: task._id,
      action: "created",
      performedBy: req.user.id,

      newValue: {
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate,
      },
    });

    res.status(201).json({
      message: "Task Created successfully",
      task,
    });
  } catch (err) {
    console.log("create task error", err);
    res.status(500).json({ message: err.message });
  }
};

const getTasks = async (req, res) => {
  try {
    let info = {
      isDeleted: false,
    };

    if (req.user.role === "manager") {
      info = {
        isDeleted: false,
      };
    } else if (req.user.role === "employee") {
      info = {
        assignedTo: req.user.id,
        isDeleted: false,
      };
    } else {
      return res.status(403).json({
        message: "Access Denied",
      });
    }

    const tasks = await Task.find(info)
      .populate("assignedTo", "employeeCode name email -_id")
      .lean();

    res.status(200).json({
      message: "Tasks fetched successfully",
      tasks,
    });
  } catch (err) {
    console.log("get task error", err);
    res.status(500).json({ message: err.message });
  }
};

const updateTask = async (req, res) => {
  try {
    // Invalid task ID

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid Task ID",
      });
    }
    const task = await Task.findById(req.params.id);

    // Task not exists

    if (!task || task.isDeleted) {
      return res.status(404).json({
        message: "Task Not Found",
      });
    }

    // store old values for activity log
    const oldTask = {
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
    };

    // Manager

    if (req.user.role === "manager") {
      const allowedFields = [
        "title",
        "description",
        "priority",
        "status",
        "assignedTo",
        "dueDate",
      ];

      const requestFields = Object.keys(req.body);

      const isValidField = requestFields.every((field) =>
        allowedFields.includes(field),
      );

      if (!isValidField) {
        return res.status(400).json({
          message: "Invalid fields in request",
        });
      }

      // Normalize title
      let normalizedTitle = task.title;

      if (typeof req.body.title !== "undefined") {
        if (typeof req.body.title !== "string") {
          return res.status(400).json({
            message: "Invalid title",
          });
        }
      }

      normalizedTitle = req.body.title.trim().replace(/\s+/g, " ");

      if (normalizedTitle.length < 3) {
        return res.status(400).json({
          message: "Title is too short",
        });
      }

      if (normalizedTitle.length > 100) {
        return res.status(400).json({
          message: "Title is too long",
        });
      }

      // Normalize description
      let normalizedDescription = task.description;

      if (typeof req.body.description !== "undefined") {
        if (typeof req.body.description !== "string") {
          return res.status(400).json({
            message: "Invalid description",
          });
        }
      }

      normalizedDescription = req.body.description.trim().replace(/\s+/g, " ");

      // Invalid status
      if (req.body.status && !allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({
          message: "Invalid status value",
        });
      }

      // Invalid priority
      if (req.body.priority && !allowedPriorities.includes(req.body.priority)) {
        return res.status(400).json({
          message: "Invalid priority value",
        });
      }

      // Invalid assigned user
      if (req.body.assignedTo) {
        if (!mongoose.Types.ObjectId.isValid(req.body.assignedTo)) {
          return res.status(400).json({
            message: "Invalid assigned user ID",
          });
        }

        // Assigned user not exists
        const userExists = await User.findById(req.body.assignedTo);
        if (!userExists) {
          return res.status(404).json({
            message: "Assigned user not found",
          });
        }
      }

      //Invalid due date
      if (req.body.dueDate) {
        const dueDate = new Date(req.body.dueDate);

        if (isNaN(dueDate.getTime())) {
          return res.status(400).json({
            message: "Invalid due date",
          });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < today) {
          return res.status(400).json({
            message: "Due date can not be in the past",
          });
        }
      }

      // Duplicate active task status
      if (normalizedTitle !== task.title || req.body.assignedTo) {
        const duplicateTask = await Task.exists({
          _id: { $ne: task._id },
          title: new RegExp(`^${normalizedTitle}$`, "i"),
          assignedTo: req.body.assignedTo || task.assignedTo,
          isDeleted: false,
          status: {
            $nin: ["done", "rejected"],
          },
        });

        if (duplicateTask) {
          return res.status(400).json({
            message: "similar active task already exists",
          });
        }
      }

      // Assign values

      if ("title" in req.body) {
        task.title = normalizedTitle;
      }
      if ("description" in req.body) {
        task.description = normalizedDescription;
      }
      if ("priority" in req.body) {
        task.priority = req.body.priority;
      }

      if ("status" in req.body) {
        task.status = req.body.status;
      }

      if ("assignedTo" in req.body) {
        task.assignedTo = req.body.assignedTo;
      }

      if ("dueDate" in req.body) {
        task.dueDate = req.body.dueDate;
      }
      if (!task.isModified()) {
        return res.status(200).json({
          message: "No changes detected",
          // task,
        });
      }
    } else if (req.user.role === "employee") {
      if (task.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      // Extra fields are not allowed
      const allowedFields = ["status"];
      const requestFields = Object.keys(req.body);

      const isValidField = requestFields.every((field) =>
        allowedFields.includes(field),
      );

      if (!isValidField) {
        return res.status(400).json({
          message: "Employee can update only status",
        });
      }

      // Invalid status
      if (req.body.status && !allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({
          message: "Invalid status value",
        });
      }

      // No changes
      if (!req.body.status || req.body.status === task.status) {
        return res.status(200).json({
          message: "No changes detected",
          // task,
        });
      }

      // preventing reopening completed or rejected tasks
      if (task.status === "done" || task.status === "rejected") {
        return res.status(400).json({
          message: "Completed or rejected tasks can not be modified",
        });
      }

      task.status = req.body.status;
    } else {
      return res.status(403).json({
        message: "Invalid role",
      });
    }

    const updatedTask = await task.save();

    // activity log for update task

    const activityLogs = [];

    if (oldTask.title !== task.title) {
      activityLogs.push({
        taskId: task._id,
        action: "updated",
        fieldChanged: "title",
        oldValue: oldTask.title,
        newValue: task.title,
        performedBy: req.user.id,
      });
    }

    if (oldTask.description !== task.description) {
      activityLogs.push({
        taskId: task._id,
        action: "updated",
        fieldChanged: "description",
        oldValue: oldTask.description,
        newValue: task.description,
        performedBy: req.user.id,
      });
    }

    if (oldTask.priority !== task.priority) {
      activityLogs.push({
        taskId: task._id,
        action: "updated",
        fieldChanged: "priority",
        oldValue: oldTask.priority,
        newValue: task.priority,
        performedBy: req.user.id,
      });
    }

    if (oldTask.status !== task.status) {
      activityLogs.push({
        taskId: task._id,
        action: "updated",
        fieldChanged: "status",
        oldValue: oldTask.status,
        newValue: task.status,
        performedBy: req.user.id,
      });
    }

    if (oldTask.assignedTo.toString() !== task.assignedTo.toString()) {
      activityLogs.push({
        taskId: task._id,
        action: "updated",
        fieldChanged: "assignedTo",
        oldValue: oldTask.assignedTo,
        newValue: task.assignedTo,
        performedBy: req.user.id,
      });
    }

    if (oldTask.dueDate?.toISOString() !== task.dueDate?.toISOString()) {
      activityLogs.push({
        taskId: task._id,
        action: "updated",
        fieldChanged: "dueDate",
        oldValue: oldTask.dueDate,
        newValue: task.dueDate,
        performedBy: req.user.id,
      });
    }

    if (activityLogs.length > 0) {
      await TaskActivityLog.insertMany(activityLogs);
    }

    return res.status(200).json({
      message: "Task updated successfully",
      updatedTask,
    });
  } catch (err) {
    console.log("update task error", err);
    res.status(500).json({
      message: err.message,
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid Task ID",
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task || task.isDeleted) {
      return res.status(404).json({
        message: "Task Not Found",
      });
    }
    if (req.user.role !== "manager") {
      return res.status(403).json({
        message: "Access Denied",
      });
    }

    task.isDeleted = true;
    task.deletedBy = req.user.id;
    task.deletedAt = new Date();

    await task.save();

    // Activity log for task deleted

    await TaskActivityLog.create({
      taskId: task._id,
      action: "deleted",
      performedBy: req.user.id,
    });

    return res.status(200).json({
      message: "Task Deleted successfully",
      task,
    });
  } catch (err) {
    console.log("delete task error", err);
    return res.status(500).json({
      message: err.message,
    });
  }
};

const getActivityLogs = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid Task ID",
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not exists",
      });
    }

    if (req.user.role === "manager") {
    } else if (req.user.role === "employee") {
      if (task.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else {
      return res.status(403).json({
        message: "Invalid role",
      });
    }

    const logs = await TaskActivityLog.find({
      taskId: req.params.id,
    })
      .populate("performedBy", "employeeCode name email -_id")
      .select("-__v")
      .lean();

    return res.status(200).json({
      message: "Activity logs fetched successfully",
      totalLogs: logs.length,
      logs,
    });
  } catch (err) {
    console.log("get activity logs error", err);
    return res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getActivityLogs,
};
