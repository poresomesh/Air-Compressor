const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const logRoutes = require("./routes/logRoutes");
app.use("/api/auth", authRoutes);
app.use("/api/plant", logRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Smruthi Organics Plant API Running Successfully!");
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully!");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
  });