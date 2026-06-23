const { mongoose } = require("mongoose");
const Task = require("../models/Task");
const User = require("../models/User");
const TaskActivityLog = require("../models/TaskActivityLog");
const Notification = require("../models/Notification");
const { normalizeDate } = require("../utils/normalizedDate");
const { escapeRegex } = require("../utils/regex");
const createNotifications = require("../utils/createNotification");
const handleTaskActivity = require("../utils/handleTaskActivity");
const generateTaskNumber = require("../utils/generateTaskNumber");

const allowedStatuses = Task.schema.path("status").enumValues;
const allowedPriorities = Task.schema.path("priority").enumValues;

const createTask = async (req, res) => {
  try {
    let { title, description, assignedTo, priority, dueDate } = req.body;

    let taskAssignedTo;
    if (req.user.role === "manager") {
      taskAssignedTo = assignedTo;
    } else if (req.user.role === "employee") {
      if (assignedTo && assignedTo !== req.user.id) {
        return res.status(403).json({
          message: "Employees can only assign tasks to themselves",
        });
      }
      taskAssignedTo = req.user.id;
    } else {
      return res.status(403).json({
        message: "Access Denied",
      });
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

    if (req.user.role === "manager") {
      if (!title || !assignedTo || !priority) {
        return res.status(400).json({
          message: "Required fileds are missing",
        });
      }
    }

    if (req.user.role === "employee") {
      if (!title || !priority) {
        return res.status(400).json({
          message: "Required fileds are missing",
        });
      }
    }

    // min title length
    if (title.length < 3) {
      return res.status(400).json({
        message: "Title is too short",
      });
    }

    // max title length
    if (title.length > 100) {
      return res.status(400).json({
        message: "Title is too long",
      });
    }

    // Invalid user ID
    if (!mongoose.Types.ObjectId.isValid(taskAssignedTo)) {
      return res.status(400).json({
        message: "Invalid assigned user ID",
      });
    }

    // user not exists
    const userExists = await User.findById(taskAssignedTo);

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
    dueDate = dueDate || null;
    if (dueDate) {
      const taskDueDate = new Date(dueDate);

      if (isNaN(taskDueDate.getTime())) {
        return res.status(400).json({
          message: "Invalid due date",
        });
      }

      const today = normalizeDate(new Date());

      const normalizedDueDate = normalizeDate(taskDueDate);

      if (normalizedDueDate < today) {
        return res.status(400).json({
          message: "Due date cannot be in the past",
        });
      }
    }

    // task already exists
    const existingTask = await Task.exists({
      title: new RegExp(`^${title.trim().replace(/\s+/g, " ")}$`, "i"),
      assignedTo: taskAssignedTo,
      isDeleted: false,
      status: {
        $nin: ["done", "rejected"],
      },
    });

    if (existingTask) {
      return res.status(409).json({
        message: `A similar active task is already assigned to ${userExists.name}`,
      });
    }

    const taskNumber = await generateTaskNumber();

    // create task if all conditions pass
    const task = await Task.create({
      title,
      description,
      status: "next",
      priority: priority || "minor",
      assignedTo: taskAssignedTo,
      dueDate,
      createdBy: req.user.id,
      taskNumber,
    });
    // console.log("task created");

    // Activity log for task created

    const log = await TaskActivityLog.create({
      taskId: task._id,

      action: "created",

      performedBy: req.user.id,
    });
    await task.populate([
      {
        path: "createdBy",
        select: "name email",
      },
      {
        path: "assignedTo",
        select: "name email",
      },
    ]);
    await handleTaskActivity({
      activityLog: log,
      task,
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
    // pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // filtering
    const search = req.query.search || "";
    const status = req.query.status || "";
    const priority = req.query.priority || "";
    const assignedTo = req.query.assignedTo || "";

    let filter = {
      isDeleted: false,
    };

    if (req.user.role === "manager") {
      filter = {
        isDeleted: false,
      };
    } else if (req.user.role === "employee") {
      filter = {
        assignedTo: req.user.id,
        isDeleted: false,
      };
    } else {
      return res.status(403).json({
        message: "Access Denied",
      });
    }

    // filter by search, status,priority,assignedTo
    if (search) {
      filter.$or = [
        {
          title: {
            $regex: escapeRegex(search),
            $options: "i",
          },
        },
        {
          taskNumber: {
            $regex: escapeRegex(search),
            $options: "i",
          },
        },
      ];
    }

    if (status === "active") {
      filter.status = {
        $in: ["next", "in-progress"],
      };
    } else if (status === "overdue") {
      const today = normalizeDate(new Date());
      filter.dueDate = {
        $lt: today,
      };
      filter.status = {
        $nin: ["done", "rejected"],
      };
    } else if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (assignedTo && req.user.role === "manager") {
      filter.assignedTo = assignedTo;
    }

    // total tasks
    const totalTasks = await Task.countDocuments(filter);

    const tasks = await Task.find(filter)
      .populate("assignedTo", "employeeCode name email ")
      .populate("createdBy", "employeeCode name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const task = await Task.findOne().sort({ taskNumber: -1 });

    return res.status(200).json({
      message: "Tasks fetched successfully",
      tasks,
      pagination: {
        totalTasks,
        currentPage: page,
        totalPages: Math.ceil(totalTasks / limit),
        limit,
      },
    });
  } catch (err) {
    console.log("get task error", err);
    res.status(500).json({ message: err.message });
  }
};

const getTaskHistory = async (req, res) => {
  try {
    // pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // filtering
    const search = req.query.search || "";
    const filter = req.query.filter || "";
    const assignedTo = req.query.assignedTo || "";

    const query = {};

    if (!filter || filter === "all-history") {
      query.$or = [
        { status: "done" },
        { status: "rejected" },
        { isDeleted: true },
      ];
    }

    if (filter === "completed") {
      query.status = "done";
    }
    if (filter === "rejected") {
      query.status = "rejected";
    }
    if (filter === "deleted") {
      query.isDeleted = true;
    }
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // search
    if (search) {
      query.$or = [
        {
          title: {
            $regex: escapeRegex(search),
            $options: "i",
          },
        },
        {
          taskNumber: {
            $regex: escapeRegex(search),
            $options: "i",
          },
        },
      ];
    }

    if (req.user.role === "manager") {
    } else if (req.user.role === "employee") {
      query.assignedTo = req.user.id;
    } else {
      return res.status(403).json({
        message: "Access Denied",
      });
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "employeeCode name email ")
      .populate("deletedBy", "employeeCode name email")
      .sort({ updatedAt: -1 })
      .lean();

    const formattedTasks = await Promise.all(
      tasks.map(async (task) => {
        let activity = null;

        let finalStatus = "";

        if (task.isDeleted) {
          finalStatus = "deleted";
        } else if (task.status === "done") {
          finalStatus = "completed";
        } else if (task.status === "rejected") {
          finalStatus = "rejected";
        }

        if (finalStatus === "deleted") {
          activity = await TaskActivityLog.findOne({
            taskId: task._id,
            action: "deleted",
          })
            .populate("performedBy", "employeeCode name email")
            .sort({ createdAt: -1 })
            .lean();
        } else {
          activity = await TaskActivityLog.findOne({
            taskId: task._id,

            action: "updated",
            fieldChanged: "status",
            newValue: task.status,
          })
            .populate("performedBy", "employeeCode name email")
            .sort({ createdAt: -1 })
            .lean();
        }

        return {
          ...task,

          finalStatus,

          performedBy: activity?.performedBy || null,

          actionDate: activity?.createdAt || null,
        };
      }),
    );

    let filteredTasks = formattedTasks;

    if (filter === "completed") {
      filteredTasks = formattedTasks.filter(
        (task) => task.finalStatus === "completed",
      );
    }

    if (filter === "rejected") {
      filteredTasks = formattedTasks.filter(
        (task) => task.finalStatus === "rejected",
      );
    }

    if (filter === "deleted") {
      filteredTasks = formattedTasks.filter(
        (task) => task.finalStatus === "deleted",
      );
    }

    // console.log(
    //   filteredTasks.map((t) => ({
    //     title: t.title,

    //     status: t.status,

    //     finalStatus: t.finalStatus,

    //     isDeleted: t.isDeleted,
    //   })),
    // );

    const totalTasks = filteredTasks.length;

    const paginatedTasks = filteredTasks.slice(skip, skip + limit);

    return res.status(200).json({
      message: "Tasks history fetched successfully",
      tasks: paginatedTasks,
      pagination: {
        totalTasks,
        currentPage: page,
        totalPages: Math.ceil(totalTasks / limit),
        limit,
      },
    });
  } catch (err) {
    console.log("get task history error", err);
    res.status(500).json({ message: err.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid Task ID",
      });
    }

    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "employeeCode name email")
      .populate("createdBy", "employeeCode name email role")
      .select("-__v")
      .lean();

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (req.user.role === "employee") {
      if (task.assignedTo?._id.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Access denied",
        });
      }
    }

    return res.status(200).json({
      message: "Task fetched successfully",
      task,
    });
  } catch (err) {
    console.log("get task by ID error", err);
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

      if ("title" in req.body)
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

      if ("description" in req.body)
        normalizedDescription = req.body.description
          .trim()
          .replace(/\s+/g, " ");

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

        const today = normalizeDate(new Date());

        const normalizedDueDate = normalizeDate(req.body.dueDate);

        if (normalizedDueDate < today) {
          return res.status(400).json({
            message: "Due date can not be in the past",
          });
        }
      }

      // Duplicate active task status
      if (normalizedTitle !== task.title || req.body.assignedTo) {
        const duplicateTask = await Task.exists({
          _id: { $ne: task._id },
          title: new RegExp(`^${escapeRegex(normalizedTitle)}$`, "i"),
          assignedTo: req.body.assignedTo || task.assignedTo,
          isDeleted: false,
          status: {
            $nin: ["done", "rejected"],
          },
        });

        if (duplicateTask) {
          return res.status(409).json({
            message: `A similar active task is already assigned to ${userExists.name}`,
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
        if (req.body.status === "done" && task.status !== "done") {
          task.completedAt = new Date();
        }

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
          message: "Employee can only update task details assigned to them",
        });
      }

      const isSelfCreated = task.createdBy.toString() === req.user.id;

      if (isSelfCreated) {
        const allowedFields = [
          "title",
          "description",
          "priority",
          "status",
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

        if ("title" in req.body)
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

        if ("description" in req.body)
          normalizedDescription = req.body.description
            .trim()
            .replace(/\s+/g, " ");

        // Invalid status
        if (req.body.status && !allowedStatuses.includes(req.body.status)) {
          return res.status(400).json({
            message: "Invalid status value",
          });
        }

        // Invalid priority
        if (
          req.body.priority &&
          !allowedPriorities.includes(req.body.priority)
        ) {
          return res.status(400).json({
            message: "Invalid priority value",
          });
        }

        //Invalid due date
        if (req.body.dueDate) {
          const dueDate = new Date(req.body.dueDate);

          if (isNaN(dueDate.getTime())) {
            return res.status(400).json({
              message: "Invalid due date",
            });
          }

          const today = normalizeDate(new Date());

          const normalizedDueDate = normalizeDate(req.body.dueDate);

          if (normalizedDueDate < today) {
            return res.status(400).json({
              message: "Due date can not be in the past",
            });
          }
        }

        // Duplicate active task status
        if (normalizedTitle !== task.title || req.body.assignedTo) {
          const duplicateTask = await Task.exists({
            _id: { $ne: task._id },
            title: new RegExp(`^${escapeRegex(normalizedTitle)}$`, "i"),
            assignedTo: req.body.assignedTo || task.assignedTo,
            isDeleted: false,
            status: {
              $nin: ["done", "rejected"],
            },
          });

          if (duplicateTask) {
            return res.status(409).json({
              message: `A similar active task is already exists`,
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
          if (req.body.status === "done" && task.status !== "done") {
            task.completedAt = new Date();
          }

          task.status = req.body.status;
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
      } else {
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
        if (
          (task.status === "done" || task.status === "rejected") &&
          req.body.status &&
          req.body.status !== task.status
        ) {
          return res.status(400).json({
            message: "Completed or rejected tasks can not be modified",
          });
        }

        if (req.body.status === "done" && task.status !== "done") {
          task.completedAt = new Date();
        }
        task.status = req.body.status;
      }
    } else {
      return res.status(403).json({
        message: "Invalid role",
      });
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name employeeCode email")
      .populate("createdBy", "name employeeCode email")
      .lean();
    // activity log for update task

    const oldAssignedUser = await User.findById(oldTask.assignedTo);

    const newAssignedUser = await User.findById(task.assignedTo);

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
        oldValue: oldAssignedUser?.name,
        newValue: newAssignedUser?.name,
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
      const logs = await TaskActivityLog.insertMany(activityLogs);

      await task.populate([
        {
          path: "createdBy",
          select: "name email",
        },
        {
          path: "assignedTo",
          select: "name email",
        },
      ]);

      for (const log of logs) {
        await handleTaskActivity({
          activityLog: log,
          task,
        });
      }
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
    if (req.user.role === "manager") {
    } else if (req.user.role === "employee") {
      if (task.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Employees can only delete tasks they created",
        });
      }
    } else {
      return res.status(403).json({
        message: "Access Denied",
      });
    }

    task.isDeleted = true;
    task.deletedBy = req.user.id;
    task.deletedAt = new Date();

    await task.save();

    // Activity log for task deleted

    const log = await TaskActivityLog.create({
      taskId: task._id,
      action: "deleted",
      performedBy: req.user.id,
    });

    await task.populate([
      {
        path: "createdBy",
        select: "name email",
      },
      {
        path: "assignedTo",
        select: "name email",
      },
    ]);

    await handleTaskActivity({
      activityLog: log,
      task,
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

module.exports = {
  createTask,
  getTasks,
  getTaskHistory,
  getTaskById,
  updateTask,
  deleteTask,
};
