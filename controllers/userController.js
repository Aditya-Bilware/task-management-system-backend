const User = require("../models/User");
const Task = require("../models/Task");

const { normalizeDate } = require("../utils/normalizedDate");

const getEmployees = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const employees = await User.find({
      role: "employee",
    })
      .select("_id name employeeCode email")
      .sort({
        name: 1,
      });

    return res.status(200).json({
      message: "Employees fetched successfully",

      employees,
    });
  } catch (err) {
    console.log("get employees error", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

const getEmployeesStats = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;

    const skip = (page - 1) * limit;

    const search = req.query.search || "";

    if (req.user.role !== "manager") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const totalEmployees = await User.countDocuments({
      role: "employee",
      $or: [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },

        {
          employeeCode: {
            $regex: search,
            $options: "i",
          },
        },
      ],
    });

    const employees = await User.find({
      role: "employee",

      $or: [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },

        {
          employeeCode: {
            $regex: search,
            $options: "i",
          },
        },
      ],
    })
      .select("_id name employeeCode email")
      .sort({
        name: 1,
      })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedEmployees = await Promise.all(
      employees.map(async (emp) => {
        const activeTasks = await Task.countDocuments({
          assignedTo: emp._id,
          isDeleted: false,

          status: {
            $in: ["in-progress", "next"],
          },
        });

        const completedTasks = await Task.countDocuments({
          assignedTo: emp._id,
          isDeleted: false,
          status: "done",
        });

        const overdueTasks = await Task.countDocuments({
          assignedTo: emp._id,
          isDeleted: false,

          dueDate: {
            $lt: normalizeDate(new Date()),
          },
          status: {
            $nin: ["done", "rejected"],
          },
        });

        const rejectedTasks = await Task.countDocuments({
          assignedTo: emp._id,
          isDeleted: false,

          status: "rejected",
        });

        return {
          ...emp,

          stats: {
            activeTasks,
            completedTasks,
            overdueTasks,
            rejectedTasks,
          },
        };
      }),
    );
    return res.status(200).json({
      message: "Employee stats fetched successfully",
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalEmployees / limit),
        totalEmployees,
        limit,
      },
      employees: formattedEmployees,
    });
  } catch (err) {
    console.log("get employees stats error", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = {
  getEmployees,
  getEmployeesStats,
};
