const Counter = require("../models/Counter");

const generateTaskNumber = async () => {
  const counter = await Counter.findByIdAndUpdate(
    "task",
    {
      $inc: {
        sequenceValue: 1,
      },
    },
    {
      returnDocument: "after",
      upsert: true,
    },
  );

  return `TMS-${String(counter.sequenceValue).padStart(4, "0")}`;
};

module.exports = generateTaskNumber;
