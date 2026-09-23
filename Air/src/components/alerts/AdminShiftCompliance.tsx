import React, { useState, useEffect } from "react";
import API from "../../utils/api";

export const AdminShiftCompliance: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [repRes, logRes, attRes] = await Promise.all([
        API.get("/plant/reports"),
        API.get("/plant/logs", { params: { date: today } }),
        API.get("/plant/attendance")
      ]);
      setReports(Array.isArray(repRes.data) ? repRes.data : []);
      setTodayLogs(Array.isArray(logRes.data) ? logRes.data : []);
      setAttendance(Array.isArray(attRes.data) ? attRes.data : []);
    } catch {
      // ignore errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 45000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const currentHour = new Date().getHours();

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
            🏭 Live Shift Status & Operations Desk
          </h3>
          <p className="text-[11px] text-slate-500">
            Attendance mark jhalyavar shift active hote aani admin ne report accept kelya nantar shift close hote.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-xl font-bold transition cursor-pointer"
        >
          {loading ? "..." : "↻ Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
        {["A", "B", "C"].map((sName) => {
          // 1. Check Attendance: Aaj ya shift chi attendance lagli ahe ka?
          const attRecord = attendance.find((a) => a.date === today && a.shift === sName);
          const hasAttended = Boolean(attRecord);

          // 2. Check Closed: Admin ne report Accept kela ahe ka?
          const isClosed = reports.some(
            (r) =>
              r.date === today &&
              r.shift === sName &&
              (r.status === "COMPLETED" || r.status === "ACCEPTED")
          );

          // 3. Shift Active State: Attendance asel aani close nasel zali tarach Active!
          const isActive = hasAttended && !isClosed;

          // 4. Logs count
          const shiftLogs = todayLogs.filter((l) => l.shift === sName);

          // 5. Hourly Reading Check (Jar active asel aani current hour chi reading nasel tar Missing Alert)
          const hasCurrentHourReading = shiftLogs.some((l) => {
            if (!l.readingTime) return false;
            const h = parseInt(l.readingTime.split(":")[0], 10);
            return h === currentHour;
          });
          const isMissingHourly = isActive && !hasCurrentHourReading;

          return (
            <div
              key={sName}
              className={`p-3.5 rounded-xl border transition ${
                isClosed
                  ? "bg-slate-50 border-slate-200 opacity-70"
                  : isActive
                  ? isMissingHourly
                    ? "bg-rose-50/70 border-rose-300 ring-1 ring-rose-300"
                    : "bg-emerald-50/50 border-emerald-300"
                  : "bg-slate-50/50 border-slate-200"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-800">Shift {sName}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isClosed
                      ? "bg-slate-200 text-slate-700"
                      : isActive
                      ? "bg-emerald-100 text-emerald-800 animate-pulse"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isClosed
                    ? "🔒 SHIFT CLOSED"
                    : isActive
                    ? "🟢 ACTIVE / OPEN"
                    : "⚪ NOT STARTED"}
                </span>
              </div>

              <div className="mt-2.5 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Operator:</span>
                  <strong className="text-slate-800">
                    {attRecord ? attRecord.operatorName : "Not Checked-In"}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Readings:</span>
                  <strong className="text-slate-900 font-mono">{shiftLogs.length}</strong>
                </div>
              </div>

              {/* Admin sathi Missing Reading cha Alert badge */}
              {isMissingHourly && (
                <div className="mt-2.5 pt-2 border-t border-rose-200 text-[10px] font-extrabold text-rose-700 flex items-center gap-1">
                  <span>⚠️ Reading Pending for {currentHour.toString().padStart(2, "0")}:00!</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};