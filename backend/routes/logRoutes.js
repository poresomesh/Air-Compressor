const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const LogEntry = require("../models/LogEntry");
const ShiftReport = require("../models/ShiftReport");
const Attendance = require("../models/Attendance");

// Middleware: Verify Token & Decode User Information
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Login token is missing!" });
  }

  jwt.verify(token, process.env.JWT_SECRET || "smruthi_secret_key_12345", (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token!" });
    }
    req.user = decoded; // { id, role, assignedShift, name }
    next();
  });
};

// 1. GET LOGS: View entries filtered by role (Admin gets all, Operators get their assigned shift)
router.get("/logs", authMiddleware, async (req, res) => {
  try {
    const { blockType, date } = req.query;
    let filter = {};

    if (blockType) filter.blockType = blockType;
    if (date) filter.date = date;

    // Shift users can only access their assigned shift
    if (req.user.role !== "admin") {
      filter.shift = req.user.assignedShift;
    }

    const logs = await LogEntry.find(filter).sort({ entryTimestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST LOG: Save log entry with automatic live timestamp
router.post("/logs", authMiddleware, async (req, res) => {
  try {
    const { blockType, shift, date, readingTime, data } = req.body;

    // Restrict shift users to their assigned shift only
    const finalShift = req.user.role === "admin" ? shift : req.user.assignedShift;

    const newEntry = new LogEntry({
      blockType,
      shift: finalShift,
      date,
      readingTime,
      entryTimestamp: new Date(), // Automatic server timestamp
      operatorName: req.user.name,
      createdBy: req.user.id,
      data
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. PUT LOG: Edit entry (Admin only)
router.put("/logs/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access Denied: Only Admin can edit log entries!" });
    }

    const updatedEntry = await LogEntry.findByIdAndUpdate(
      req.params.id,
      { data: req.body.data, readingTime: req.body.readingTime },
      { new: true }
    );
    res.json(updatedEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. DELETE LOG: Delete entry (Admin only)
router.delete("/logs/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access Denied: Only Admin can delete log entries!" });
    }

    await LogEntry.findByIdAndDelete(req.params.id);
    res.json({ message: "Entry successfully deleted!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. POST REPORT: Submit End-of-Shift report (Shift Operators)
router.post("/reports", authMiddleware, async (req, res) => {
  try {
    const { workSummary, issuesFaced, date } = req.body;

    const report = new ShiftReport({
      shift: req.user.assignedShift,
      date: date || new Date().toISOString().split("T")[0],
      operatorName: req.user.name,
      workSummary,
      issuesFaced: issuesFaced || "None",
      status: "PENDING"
    });

    await report.save();
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. GET REPORTS: Fetch shift reports (Admin gets all, Operators get their own)
router.get("/reports", authMiddleware, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role !== "admin") {
      filter.shift = req.user.assignedShift;
    }

    const reports = await ShiftReport.find(filter).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. PATCH REPORT ACCEPT: Mark report as accepted/completed (Admin only)
router.patch("/reports/:id/accept", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access Denied: Only Admin can accept reports!" });
    }

    const acceptedReport = await ShiftReport.findByIdAndUpdate(
      req.params.id,
      { status: "COMPLETED" },
      { new: true }
    );
    res.json(acceptedReport);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. PATCH REPORT UPDATE: Handle Admin queries or Operator corrections with History
router.patch("/reports/:id", authMiddleware, async (req, res) => {
  try {
    const { newQueryMessage, sender, status, workSummary, issuesFaced } = req.body;

    const updateFields = {};
    if (status !== undefined) updateFields.status = status;
    if (workSummary !== undefined) updateFields.workSummary = workSummary;
    if (issuesFaced !== undefined) updateFields.issuesFaced = issuesFaced;

    let updateQuery = { $set: updateFields };

    // Jar navin query kiva operator cha reply asel tar array madhe push kara
    if (newQueryMessage) {
      updateQuery.$push = {
        queries: {
          sender: sender || (req.user.role === "admin" ? "Admin" : "Operator"),
          message: newQueryMessage,
          timestamp: new Date()
        }
      };
    }

    const updatedReport = await ShiftReport.findByIdAndUpdate(
      req.params.id,
      updateQuery,
      { new: true }
    );

    if (!updatedReport) {
      return res.status(404).json({ message: "Report not found!" });
    }

    res.json(updatedReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- ATTENDANCE APIS ---

// 1. Mark Attendance (Operator live punch OR Admin manual entry)
router.post("/attendance", authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    let finalUserId, finalOperatorName, finalShift, finalDate, finalTime;

    if (isAdmin && req.body.operatorName) {
      // Admin manual override entry
      finalUserId = req.body.userId || "admin-manual-entry";
      finalOperatorName = req.body.operatorName;
      finalShift = req.body.shift;
      finalDate = req.body.date;
      finalTime = req.body.checkInTime;
    } else {
      // Operator live strict punch
      finalUserId = req.user.id || req.user._id;
      finalOperatorName = req.user.name;
      finalShift = req.user.assignedShift;
      finalDate = new Date().toISOString().split("T")[0];
      finalTime = new Date().toLocaleTimeString("en-US", { hour12: true });

      // Operator sathi duplicate check
      const existing = await Attendance.findOne({
        userId: finalUserId,
        date: finalDate,
        shift: finalShift
      });

      if (existing) {
        return res.status(400).json({ message: "Today's shift attendance already recorded!" });
      }
    }

    const attendance = new Attendance({
      userId: finalUserId,
      operatorName: finalOperatorName,
      shift: finalShift,
      date: finalDate,
      checkInTime: finalTime,
      status: "PRESENT"
    });

    await attendance.save();
    res.status(201).json(attendance);
  } catch (err) {
    console.error("Attendance Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// 2. Get Attendance (Admin gets all, Operator gets own)
router.get("/attendance", authMiddleware, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role !== "admin") {
      filter.userId = req.user.id;
    }

    const records = await Attendance.find(filter).sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;