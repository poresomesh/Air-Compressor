const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      enum: ["admin", "shift_user"], 
      default: "shift_user" 
    },
    assignedShift: { 
      type: String, 
      enum: ["A", "B", "C", "ALL"], 
      default: "ALL" 
    },
    name: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);