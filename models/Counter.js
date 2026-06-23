const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: String,

  sequenceValue: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Counter", counterSchema);
