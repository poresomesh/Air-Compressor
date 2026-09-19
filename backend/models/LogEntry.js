const mongoose = require("mongoose");

const LogEntrySchema = new mongoose.Schema(
  {
    blockType: { 
      type: String, 
      enum: ["AIR_COMPRESSOR", "CHILLING_COMPRESSOR"], 
      required: true 
    },
    shift: { 
      type: String, 
      enum: ["A", "B", "C"], 
      required: true 
    },
    date: { type: String, required: true },
    readingTime: { type: String, required: true },
    entryTimestamp: { type: Date, default: Date.now }, // Live system entry time
    operatorName: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    data: { type: Object, required: true } // Readings payload
  },
  { timestamps: true }
);

module.exports = mongoose.model("LogEntry", LogEntrySchema);