const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const User = require("./models/User");

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for seeding...");

    // Junya users la clear karaycha asel tar:
    await User.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash("admin123", salt);
    const shiftPassword = await bcrypt.hash("shift123", salt);

    const users = [
      {
        username: "admin",
        password: adminPassword,
        role: "admin",
        assignedShift: "ALL",
        name: "Plant Admin"
      },
      {
        username: "operator_a",
        password: shiftPassword,
        role: "shift_user",
        assignedShift: "A",
        name: "Operator Shift A"
      },
      {
        username: "operator_b",
        password: shiftPassword,
        role: "shift_user",
        assignedShift: "B",
        name: "Operator Shift B"
      },
      {
        username: "operator_c",
        password: shiftPassword,
        role: "shift_user",
        assignedShift: "C",
        name: "Operator Shift C"
      }
    ];

    await User.insertMany(users);
    console.log("4 Users successfully created in Database!");
    process.exit();
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedUsers();