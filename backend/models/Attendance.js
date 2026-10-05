const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  operatorName: {
    type: String, // 👉 हे फील्ड इथे असायलाच पाहिजे
    required: true
  },
  shift: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  checkInTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: "PRESENT"
  }
}, { timestamps: true });

module.exports = mongoose.model("Attendance", attendanceSchema);