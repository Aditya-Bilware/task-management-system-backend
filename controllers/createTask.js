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

    // create task if all conditions pass
    const task = await Task.create({
      title,
      description,
      status: "next",
      priority: priority || "minor",
      assignedTo: taskAssignedTo,
      dueDate,
      createdBy: req.user.id,
    });
    // console.log("task created");

    // Activity log for task created

    await TaskActivityLog.create({
      taskId: task._id,

      action: "created",

      performedBy: req.user.id,
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
