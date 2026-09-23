import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../utils/api";

export const ShiftAlertBanner: React.FC = () => {
  const { user } = useAuth();
  const [showAlert, setShowAlert] = useState(false);
  const [missingHour, setMissingHour] = useState("");

  const checkShiftCompliance = async () => {
    // Admin la ha banner dakhavaycha nahi
    if (!user || user.role === "admin") return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const currentHour = new Date().getHours();

      // Shift normalize kara: "Shift A" -> "A", "a" -> "A"
      const rawShift = user.assignedShift || "";
      const currentShift = rawShift.replace(/Shift\s*/i, "").trim().toUpperCase() || "A";

      const [attRes, repRes, logRes] = await Promise.all([
        API.get("/plant/attendance"),
        API.get("/plant/reports"),
        API.get("/plant/logs", { params: { date: today } })
      ]);

      const attList = Array.isArray(attRes.data) ? attRes.data : [];
      const repList = Array.isArray(repRes.data) ? repRes.data : [];
      const logList = Array.isArray(logRes.data) ? logRes.data : [];

      // 1. Attendance check (Date aani Shift match kara)
      const hasAttendance = attList.some((a: any) => {
        const aShift = (a.shift || "").replace(/Shift\s*/i, "").trim().toUpperCase();
        return a.date === today && (aShift === currentShift || a.userId === user.id || a.userId === (user as any)._id);
      });

      // Jar attendance nasel tar shift suru nahi
      if (!hasAttendance) {
        setShowAlert(false);
        return;
      }

      // 2. Shift close check (Report ACCEPTED / COMPLETED asel tar band)
      const isClosed = repList.some((r: any) => {
        const rShift = (r.shift || "").replace(/Shift\s*/i, "").trim().toUpperCase();
        return (
          r.date === today &&
          rShift === currentShift &&
          (r.status === "COMPLETED" || r.status === "ACCEPTED")
        );
      });

      if (isClosed) {
        setShowAlert(false);
        return;
      }

      // 3. Current Hour reading check
      const hasCurrentHourReading = logList.some((l: any) => {
        const lShift = (l.shift || "").replace(/Shift\s*/i, "").trim().toUpperCase();
        if (lShift !== currentShift || !l.readingTime) return false;
        const h = parseInt(l.readingTime.split(":")[0], 10);
        return h === currentHour;
      });

      if (!hasCurrentHourReading) {
        setShowAlert(true);
        setMissingHour(`${currentHour.toString().padStart(2, "0")}:00`);
      } else {
        setShowAlert(false);
      }
    } catch (err) {
      console.error("Compliance alert error:", err);
    }
  };

  useEffect(() => {
    checkShiftCompliance();
    const interval = setInterval(checkShiftCompliance, 30000); // 30 seconds interval
    return () => clearInterval(interval);
  }, [user]);

  if (!showAlert) return null;

  return (
    <div className="mb-5 bg-rose-600 border border-rose-700 text-white px-5 py-4 rounded-2xl shadow-lg flex items-center justify-between animate-bounce">
      <div className="flex items-center gap-3.5">
        <span className="text-3xl">⏰</span>
        <div>
          <h4 className="text-sm font-black tracking-wide uppercase flex items-center gap-2">
            <span>Hourly Reading Alert — Shift {user?.assignedShift}</span>
            <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">LIVE</span>
          </h4>
          <p className="text-xs text-rose-100 mt-1">
            <strong>{missingHour}</strong> che hourly reading ajun submit kelele nahiye! Krupaya Compressor / DG table madhe jaun reading record kara.
          </p>
        </div>
      </div>

      <span className="px-3.5 py-1.5 bg-white text-rose-700 font-black text-xs rounded-xl tracking-wider uppercase shadow-xs shrink-0">
        Action Required
      </span>
    </div>
  );
};