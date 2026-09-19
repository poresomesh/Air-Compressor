const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    operatorName: { type: String, required: true },
    shift: { type: String, required: true },
    date: { type: String, required: true },
    checkInTime: { type: String, required: true },
    status: { type: String, default: "PRESENT" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", AttendanceSchema);