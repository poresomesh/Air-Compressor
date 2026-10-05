const mongoose = require("mongoose");

const LogEntrySchema = new mongoose.Schema(
  {
    blockType: { 
      type: String, 
      enum: [
    "AIR_COMPRESSOR",
    "AIR_COMPRESSOR_A",
    "AIR_COMPRESSOR_B",
    "AIR_COMPRESSOR_C",
    "AIR_COMPRESSOR_D",
    "CHILLING_COMPRESSOR",
    "CHILLING_COMPRESSOR_A",
    "CHILLING_COMPRESSOR_B",
    "DG_350_KVA",
    "DG_500_KVA",

     // Power Failure Record
    "POWER_FAILURE"
  ], 
      required: true 
    },
    shift: { 
      type: String, 
      enum : ["A", "B", "C", "ALL", "G"],
      default: "A" ,
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