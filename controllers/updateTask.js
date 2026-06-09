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
          message: "Access denied",
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
        if (task.status === "done" || task.status === "rejected") {
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
