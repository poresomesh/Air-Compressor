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

// 1. GET LOGS
router.get("/logs", authMiddleware, async (req, res) => {
  try {
    const { blockType, date } = req.query;
    let filter = {};

    if (blockType) filter.blockType = blockType;
    if (date) filter.date = date;

    // Shift users can only access their assigned shift (except for global power failure)
    if (req.user.role !== "admin" && blockType !== "POWER_FAILURE") {
      filter.shift = req.user.assignedShift;
    }

    const logs = await LogEntry.find(filter).sort({ entryTimestamp: -1, createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST LOG: Save entry safely
router.post("/logs", authMiddleware, async (req, res) => {
  try {
    const { blockType, shift, date, readingTime, data } = req.body;

    // Shift जर 'ALL' किंवा undefined असेल तर 'A' मध्ये सुरक्षित फॉलबॅक
    let finalShift = "A";
    if (shift && shift !== "ALL") {
      finalShift = shift;
    } else if (req.user.assignedShift && req.user.assignedShift !== "ALL") {
      finalShift = req.user.assignedShift;
    }

    const newEntry = new LogEntry({
      blockType,
      shift: finalShift,
      date: date || new Date().toISOString().split("T")[0],
      readingTime: readingTime || "00:00",
      entryTimestamp: new Date(),
      operatorName: req.user.name || "Plant Admin",
      createdBy: req.user.id || req.user._id,
      data: data || {}
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (err) {
    console.error("LOG SAVE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// 3. PUT LOG: Edit entry
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

// 4. DELETE LOG: Delete entry
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

// 5. POST REPORT
router.post("/reports", authMiddleware, async (req, res) => {
  try {
    const { workSummary, issuesFaced, date } = req.body;

    const report = new ShiftReport({
      shift: req.user.assignedShift || "A",
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

// 6. GET REPORTS
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

// 7. PATCH REPORT ACCEPT
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

// 8. PATCH REPORT UPDATE
router.patch("/reports/:id", authMiddleware, async (req, res) => {
  try {
    const { newQueryMessage, sender, status, workSummary, issuesFaced } = req.body;

    const updateFields = {};
    if (status !== undefined) updateFields.status = status;
    if (workSummary !== undefined) updateFields.workSummary = workSummary;
    if (issuesFaced !== undefined) updateFields.issuesFaced = issuesFaced;

    let updateQuery = { $set: updateFields };

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

router.post("/attendance", authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    let finalUserId, finalOperatorName, finalShift, finalDate, finalTime;

    if (isAdmin && req.body.operatorName) {
      finalUserId = req.user.id || req.user._id; 
      finalOperatorName = req.body.operatorName.trim();
      finalShift = req.body.shift || "A";
      finalDate = req.body.date;
      finalTime = req.body.checkInTime || "08:00 AM";
    } else {
      finalUserId = req.user.id || req.user._id;
      finalOperatorName = (req.body.operatorName && req.body.operatorName.trim()) 
        ? req.body.operatorName.trim() 
        : req.user.name;

      finalShift = req.body.shift || req.user.assignedShift || "A";
      finalDate = req.body.date || new Date().toISOString().split("T")[0];
      finalTime = new Date().toLocaleTimeString("en-US", { hour12: true });

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

router.get("/attendance", authMiddleware, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role !== "admin") {
      filter.userId = req.user.id || req.user._id;
    }

    const records = await Attendance.find(filter).sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE SHIFT REPORT (Admin Only)
router.delete("/reports/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access Denied: Fakt Admin report delete karu shakto!" });
    }

    const deletedReport = await ShiftReport.findByIdAndDelete(req.params.id);
    if (!deletedReport) {
      return res.status(404).json({ message: "Report sapadla nahi!" });
    }

    res.json({ message: "Shift report successfully delete zala!" });
  } catch (err) {
    console.error("Delete Report Error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;