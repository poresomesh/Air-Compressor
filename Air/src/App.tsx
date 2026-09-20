import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "./context/AuthContext";
import { Login } from "./components/auth/Login";
import { AirCompressorTable } from "./components/airCompressor/AirCompressorTable";
import { ChillingTable } from "./components/chillingCompressor/ChillingTable";
import { TimeFilterTabs } from "./components/common/TimeFilterTabs";
import { isDateInPeriod, TimeFilterPeriod } from "./utils/dateFilters";
import API from "./utils/api";

// 1. REUSABLE QUERY TIMELINE COMPONENT
const QueryHistoryTimeline = ({ queries }: { queries: any[] }) => {
  if (!queries || queries.length === 0) return null;

  return (
    <div className="mt-3 p-3.5 bg-slate-900/5 border border-slate-200/80 rounded-xl space-y-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-600">
        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
        Query & Instruction Audit Trail
      </div>
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {queries.map((q, idx) => {
          const isAdmin = q.sender === "Admin";
          return (
            <div
              key={idx}
              className={`p-3 rounded-xl text-xs border transition-all ${
                isAdmin
                  ? "bg-amber-500/10 border-amber-300/80 text-amber-950 shadow-sm"
                  : "bg-indigo-500/10 border-indigo-300/80 text-indigo-950 shadow-sm"
              }`}
            >
              <div className="flex justify-between items-center text-[10px] font-bold mb-1.5 opacity-80">
                <span className="flex items-center gap-1">
                  {isAdmin ? "🛡️ Plant Admin" : "👷 Shift Operator"}
                </span>
                <span className="font-mono text-slate-500">{new Date(q.timestamp).toLocaleString()}</span>
              </div>
              <p className="leading-relaxed whitespace-pre-wrap font-medium">{q.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 2. ATTENDANCE PANEL
const AttendancePanel = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [msg, setMsg] = useState("");

  const [filterShift, setFilterShift] = useState<string>("ALL");
  const [activePeriod, setActivePeriod] = useState<TimeFilterPeriod>("today");

  const todayStr = new Date().toISOString().split("T")[0];
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  const [adminDate, setAdminDate] = useState(todayStr);
  const [adminTime, setAdminTime] = useState("08:00 AM");
  const [adminOperatorName, setAdminOperatorName] = useState("");
  const [adminShift, setAdminShift] = useState("A");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await API.get("/plant/attendance");
      setRecords(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleOperatorMarkAttendance = async () => {
    setMarking(true);
    setMsg("");
    try {
      await API.post("/plant/attendance");
      setMsg("✓ Attendance successfully marked!");
      await fetchAttendance();
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Failed to mark attendance.");
    } finally {
      setMarking(false);
    }
  };

  const handleAdminMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminOperatorName.trim()) {
      alert("Please enter Operator Name.");
      return;
    }
    setMarking(true);
    setMsg("");
    try {
      await API.post("/plant/attendance", {
        operatorName: adminOperatorName,
        shift: adminShift,
        date: adminDate,
        checkInTime: adminTime
      });
      setMsg("✓ Manual attendance recorded by Admin!");
      setAdminOperatorName("");
      await fetchAttendance();
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Failed to save manual attendance.");
    } finally {
      setMarking(false);
    }
  };

  const hasMarkedToday = records.some(
    (r) => r.date === todayStr && r.userId === (user?.id || (user as any)?._id)
  );

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (user?.role === "admin" && filterShift !== "ALL" && r.shift !== filterShift) {
        return false;
      }
      return isDateInPeriod(r.date, activePeriod);
    });
  }, [records, user?.role, filterShift, activePeriod]);

  const periodCounts = useMemo(() => {
    const shiftFiltered = records.filter((r) =>
      user?.role === "admin" && filterShift !== "ALL" ? r.shift === filterShift : true
    );
    return {
      today: shiftFiltered.filter((r) => isDateInPeriod(r.date, "today")).length,
      week: shiftFiltered.filter((r) => isDateInPeriod(r.date, "week")).length,
      month: shiftFiltered.filter((r) => isDateInPeriod(r.date, "month")).length,
      year: shiftFiltered.filter((r) => isDateInPeriod(r.date, "year")).length,
    };
  }, [records, user?.role, filterShift]);

  return (
    <div className="space-y-6">
      {user?.role === "shift_user" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-6 max-w-xl mx-auto backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h3 className="text-sm font-black tracking-tight text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                DAILY SHIFT ATTENDANCE PUNCH
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Official Plant Punch Record (Strict System Clock Sync)
              </p>
            </div>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-xs border border-indigo-100">
              Shift {user.assignedShift}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 mb-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Calendar Date (Locked)
              </label>
              <input
                type="text"
                value={todayStr}
                readOnly
                disabled
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Live Precision Clock
              </label>
              <input
                type="text"
                value={currentTime}
                readOnly
                disabled
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-black text-indigo-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Operator Name
              </label>
              <input
                type="text"
                value={user.name}
                readOnly
                disabled
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Designated Station
              </label>
              <input
                type="text"
                value="Plant Compressor Unit"
                readOnly
                disabled
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-not-allowed"
              />
            </div>
          </div>

          {msg && (
            <div
              className={`p-3 rounded-xl text-xs font-bold mb-4 transition-all ${
                msg.includes("✓")
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {msg}
            </div>
          )}

          <button
            onClick={handleOperatorMarkAttendance}
            disabled={marking || hasMarkedToday}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {hasMarkedToday ? (
              <>✓ Today's Attendance Already Recorded</>
            ) : marking ? (
              "Synchronizing..."
            ) : (
              <>⚡ Mark My Attendance Now</>
            )}
          </button>
        </div>
      )}

      {user?.role === "admin" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 max-w-4xl mx-auto">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                ADMIN MANUAL ATTENDANCE OVERRIDE
              </h3>
              <p className="text-[11px] text-slate-500">
                Grant manual backdated or custom time attendance for any shift operator
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-amber-800 font-extrabold text-[10px] rounded-full border border-amber-200 uppercase tracking-wider">
              Admin Override
            </span>
          </div>

          <form onSubmit={handleAdminMarkAttendance} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  required
                  value={adminDate}
                  onChange={(e) => setAdminDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Punch Time
                </label>
                <input
                  type="text"
                  required
                  value={adminTime}
                  onChange={(e) => setAdminTime(e.target.value)}
                  placeholder="08:00 AM"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-bold transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Assigned Shift
                </label>
                <select
                  value={adminShift}
                  onChange={(e) => setAdminShift(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold transition"
                >
                  <option value="A">Shift A</option>
                  <option value="B">Shift B</option>
                  <option value="C">Shift C</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Operator Name
                </label>
                <input
                  type="text"
                  required
                  value={adminOperatorName}
                  onChange={(e) => setAdminOperatorName(e.target.value)}
                  placeholder="e.g. Ramesh K."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold transition"
                />
              </div>
            </div>

            {msg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  msg.includes("✓")
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {msg}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={marking}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.99] disabled:opacity-50 flex items-center gap-1.5"
              >
                {marking ? "Processing..." : "💾 Register Manual Attendance"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight">
              {user?.role === "admin" ? "PLANT ATTENDANCE MASTER SHEET" : "MY ATTENDANCE ARCHIVE"}
            </h3>
            <p className="text-[11px] text-slate-500">
              Select time period section to view attendance history
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <TimeFilterTabs
              activePeriod={activePeriod}
              onPeriodChange={setActivePeriod}
              counts={periodCounts}
            />

            {user?.role === "admin" && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                <span className="text-[11px] font-bold text-slate-500">Shift:</span>
                <select
                  value={filterShift}
                  onChange={(e) => setFilterShift(e.target.value)}
                  className="text-xs bg-transparent font-bold text-indigo-600 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Shifts</option>
                  <option value="A">Shift A</option>
                  <option value="B">Shift B</option>
                  <option value="C">Shift C</option>
                </select>
              </div>
            )}

            <button
              onClick={fetchAttendance}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/80 transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-500 text-center py-8">Loading attendance ledger...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            No records found for period: <span className="font-bold capitalize">{activePeriod}</span>.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-black">Date</th>
                  <th className="py-3 px-4 font-black">Operator</th>
                  <th className="py-3 px-4 font-black">Assigned Shift</th>
                  <th className="py-3 px-4 font-black">Precision Punch Time</th>
                  <th className="py-3 px-4 font-black text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r) => (
                  <tr key={r._id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">{r.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{r.operatorName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold rounded-full text-[10px] border border-indigo-100">
                        Shift {r.shift}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 font-bold">{r.checkInTime}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold rounded-full text-[10px] border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// 3. OPERATOR SHIFT REPORT COMPONENT
const OperatorShiftReportSection = ({ shift, operatorName }: { shift: string; operatorName: string }) => {
  const [workSummary, setWorkSummary] = useState("");
  const [issuesFaced, setIssuesFaced] = useState("");
  const [reports, setReports] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [activePeriod, setActivePeriod] = useState<TimeFilterPeriod>("today");

  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const res = await API.get("/plant/reports");
      setReports(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post("/plant/reports", {
        workSummary,
        issuesFaced: issuesFaced || "None",
        date: new Date().toISOString().split("T")[0]
      });
      setWorkSummary("");
      setIssuesFaced("");
      await fetchMyReports();
    } catch (err: any) {
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendCorrection = async (id: string) => {
    const text = replyText[id];
    if (!text?.trim()) {
      alert("Please enter a response.");
      return;
    }
    try {
      await API.patch(`/plant/reports/${id}`, {
        newQueryMessage: text,
        sender: "Operator",
        status: "PENDING"
      });
      setReplyText((prev) => ({ ...prev, [id]: "" }));
      await fetchMyReports();
    } catch (err: any) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((rep) => isDateInPeriod(rep.date, activePeriod));
  }, [reports, activePeriod]);

  const periodCounts = useMemo(() => ({
    today: reports.filter((r) => isDateInPeriod(r.date, "today")).length,
    week: reports.filter((r) => isDateInPeriod(r.date, "week")).length,
    month: reports.filter((r) => isDateInPeriod(r.date, "month")).length,
    year: reports.filter((r) => isDateInPeriod(r.date, "year")).length,
  }), [reports]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-800">
              SHIFT {shift} - END OF SHIFT HANDOVER REPORT
            </h3>
            <p className="text-[11px] text-slate-500">
              Official handover document for Plant Engineering Admin review
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            Operator: {operatorName}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Shift Activities & Work Summary
            </label>
            <textarea
              required
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              rows={3}
              placeholder="Detail compressor hourly checks, lubricating oil pressure, and cooling towers..."
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Incidents / Pressure Deviations / Breakdown (Optional)
            </label>
            <textarea
              value={issuesFaced}
              onChange={(e) => setIssuesFaced(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              rows={2}
              placeholder="Leave as 'None' if all units operated in standard parameters..."
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition active:scale-[0.99] disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "📋 Dispatch Shift Handover Report"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
          <h4 className="text-sm font-black text-slate-800">My Submitted Shift Reports Ledger</h4>
          <TimeFilterTabs
            activePeriod={activePeriod}
            onPeriodChange={setActivePeriod}
            counts={periodCounts}
          />
        </div>

        {loading ? (
          <p className="text-xs text-slate-500 text-center py-6">Loading reports ledger...</p>
        ) : filteredReports.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            No reports submitted for period: <span className="font-bold capitalize">{activePeriod}</span>.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((rep) => (
              <div key={rep._id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 text-xs">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono font-bold text-slate-800">Date: {rep.date}</span>
                  <span
                    className={`font-black px-2.5 py-0.5 rounded-full text-[10px] ${
                      rep.status === "COMPLETED" || rep.status === "ACCEPTED"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : rep.status === "QUERY_RAISED"
                        ? "bg-rose-100 text-rose-800 border border-rose-200 animate-pulse"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {rep.status === "ACCEPTED" ? "COMPLETED" : rep.status}
                  </span>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed">
                  <strong className="text-slate-900">Work Log:</strong> {rep.workSummary}
                </p>
                {rep.issuesFaced && rep.issuesFaced !== "None" && (
                  <p className="text-rose-600 font-medium mt-1">
                    <strong>Incident:</strong> {rep.issuesFaced}
                  </p>
                )}

                <QueryHistoryTimeline queries={rep.queries} />

                {rep.status === "QUERY_RAISED" && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 flex gap-2">
                    <input
                      type="text"
                      value={replyText[rep._id] || ""}
                      onChange={(e) => setReplyText({ ...replyText, [rep._id]: e.target.value })}
                      placeholder="Type response / revised reading..."
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleSendCorrection(rep._id)}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition"
                    >
                      Resubmit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 4. ADMIN SHIFT REPORT REVIEW COMPONENT
const AdminReportsList = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterShift, setFilterShift] = useState<string>("ALL");
  const [activePeriod, setActivePeriod] = useState<TimeFilterPeriod>("today");
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await API.get("/plant/reports");
      setReports(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleCompleteReport = async (id: string) => {
    try {
      await API.patch(`/plant/reports/${id}/accept`);
      fetchReports();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSendQuery = async (id: string) => {
    if (!queryInput.trim()) return;
    try {
      await API.patch(`/plant/reports/${id}`, {
        newQueryMessage: queryInput,
        sender: "Admin",
        status: "QUERY_RAISED"
      });
      setActiveQueryId(null);
      setQueryInput("");
      fetchReports();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (filterShift !== "ALL" && r.shift !== filterShift) return false;
      return isDateInPeriod(r.date, activePeriod);
    });
  }, [reports, filterShift, activePeriod]);

  const periodCounts = useMemo(() => {
    const shiftFiltered = reports.filter((r) =>
      filterShift !== "ALL" ? r.shift === filterShift : true
    );
    return {
      today: shiftFiltered.filter((r) => isDateInPeriod(r.date, "today")).length,
      week: shiftFiltered.filter((r) => isDateInPeriod(r.date, "week")).length,
      month: shiftFiltered.filter((r) => isDateInPeriod(r.date, "month")).length,
      year: shiftFiltered.filter((r) => isDateInPeriod(r.date, "year")).length,
    };
  }, [reports, filterShift]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      <div className="flex flex-wrap justify-between items-center mb-5 gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-black text-slate-800 tracking-tight">
            SHIFT REPORTS AUDIT & REVIEW
          </h2>
          <p className="text-[11px] text-slate-500">
            Verify handover reports by time period, raise queries, and grant final sign-offs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <TimeFilterTabs
            activePeriod={activePeriod}
            onPeriodChange={setActivePeriod}
            counts={periodCounts}
          />

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[11px] font-bold text-slate-500">Shift:</span>
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="text-xs bg-transparent font-bold text-indigo-600 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Shifts</option>
              <option value="A">Shift A</option>
              <option value="B">Shift B</option>
              <option value="C">Shift C</option>
            </select>
          </div>

          <button
            onClick={fetchReports}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/80 transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 py-8 text-center">Auditing reports ledger...</p>
      ) : filteredReports.length === 0 ? (
        <p className="text-xs text-slate-400 py-8 text-center">
          No reports found for period <span className="font-bold capitalize">{activePeriod}</span>{" "}
          {filterShift !== "ALL" && `(Shift ${filterShift})`}.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((rep) => (
            <div
              key={rep._id}
              className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 text-xs space-y-2.5"
            >
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-white font-mono text-[10px] font-black px-2.5 py-0.5 rounded-md">
                    Shift {rep.shift}
                  </span>
                  <span className="font-bold text-slate-800">{rep.operatorName}</span>
                  <span className="font-mono text-slate-400 text-[11px]">({rep.date})</span>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                      rep.status === "COMPLETED" || rep.status === "ACCEPTED"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : rep.status === "QUERY_RAISED"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {rep.status === "ACCEPTED" ? "COMPLETED" : rep.status}
                  </span>
                </div>

                {rep.status !== "COMPLETED" && rep.status !== "ACCEPTED" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveQueryId(activeQueryId === rep._id ? null : rep._id)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition shadow-sm"
                    >
                      💬 Raise Query
                    </button>
                    <button
                      onClick={() => handleCompleteReport(rep._id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
                    >
                      ✓ Accept & Sign-off
                    </button>
                  </div>
                )}
              </div>

              <p className="text-slate-700 font-medium leading-relaxed">
                <strong className="text-slate-900">Work Summary:</strong> {rep.workSummary}
              </p>
              {rep.issuesFaced && rep.issuesFaced !== "None" && (
                <p className="text-rose-600 font-medium">
                  <strong>Issue / Breakdown:</strong> {rep.issuesFaced}
                </p>
              )}

              <QueryHistoryTimeline queries={rep.queries} />

              {activeQueryId === rep._id && (
                <div className="mt-3 p-3.5 bg-white border border-amber-300 rounded-xl space-y-2.5 shadow-sm">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    Instruct Operator / Specific Reading Re-check:
                  </label>
                  <textarea
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    placeholder="Specify parameter clarification needed..."
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-500"
                    rows={2}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setActiveQueryId(null)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSendQuery(rep._id)}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm"
                    >
                      Send Query
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 5. TOP METRICS STRIP
const PlantStatusHeader = ({ role, shift }: { role: string; shift?: string }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-lg">
          ⚙️
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
            Plant Status
          </span>
          <span className="text-xs font-black text-emerald-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Operational
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-lg">
          ⏱️
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
            Current Shift
          </span>
          <span className="text-xs font-black text-slate-800">
            {role === "admin" ? "All Shifts (Master)" : `Shift ${shift}`}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-lg">
          🛡️
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
            Data Integrity
          </span>
          <span className="text-xs font-black text-indigo-600">Locked / Read-Only</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-lg">
          🔒
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
            Security Mode
          </span>
          <span className="text-xs font-black text-slate-800">Role-Based Access</span>
        </div>
      </div>
    </div>
  );
};

// 6. MAIN APP CONTAINER
export function App() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"attendance" | "air" | "chilling" | "reports">("attendance");

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-16 font-sans">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20 shadow-lg px-6 lg:px-10 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md font-black text-white text-base">
              SO
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight leading-none text-white">
                  SMRUTHI ORGANICS LIMITED
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                Plant Automation & Digital Operations Cockpit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 text-xs font-bold shadow-inner">
              <button
                onClick={() => setActiveTab("attendance")}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "attendance"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                📌 Attendance
              </button>
              <button
                onClick={() => setActiveTab("air")}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "air"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Air Compressor
              </button>
              <button
                onClick={() => setActiveTab("chilling")}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "chilling"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Chilling Compressor
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "reports"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {user.role === "admin" ? "📋 Shift Reports Review" : "📋 My Shift Reports"}
              </button>
            </div>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="text-right">
                <span className="block text-xs font-bold text-white">{user.name}</span>
                <span className="block text-[10px] font-mono text-indigo-300 uppercase">
                  {user.role === "admin" ? "Plant Admin" : `Shift ${user.assignedShift}`}
                </span>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold rounded-xl transition border border-rose-500/20"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-10 pt-6">
        <PlantStatusHeader role={user.role} shift={user.assignedShift} />

        {activeTab === "attendance" && <AttendancePanel />}
        {activeTab === "air" && <AirCompressorTable />}
        {activeTab === "chilling" && <ChillingTable />}
        {activeTab === "reports" &&
          (user.role === "admin" ? (
            <AdminReportsList />
          ) : (
            <OperatorShiftReportSection
              shift={user.assignedShift}
              operatorName={user.name}
            />
          ))}
      </main>
    </div>
  );
}

export default App;