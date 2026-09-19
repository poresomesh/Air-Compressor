const mongoose = require("mongoose");

const ShiftReportSchema = new mongoose.Schema(
  {
    shift: { type: String, required: true },
    date: { type: String, required: true },
    operatorName: { type: String, required: true },
    workSummary: { type: String, required: true },
    issuesFaced: { type: String, default: "None" },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "COMPLETED", "QUERY_RAISED"],
      default: "PENDING"
    },
    // Query History Trail
    queries: [
      {
        sender: { type: String, enum: ["Admin", "Operator"] },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShiftReport", ShiftReportSchema);