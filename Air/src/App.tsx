import React, { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { Login } from "./components/auth/Login";
import { AirCompressorTable } from "./components/airCompressor/AirCompressorTable";
import { ChillingTable } from "./components/chillingCompressor/ChillingTable";
import API from "./utils/api";

// 1. REUSABLE QUERY TIMELINE COMPONENT
const QueryHistoryTimeline = ({ queries }: { queries: any[] }) => {
  if (!queries || queries.length === 0) return null;

  return (
    <div className="mt-3 p-3 bg-slate-100 border border-slate-300 rounded-lg space-y-2">
      <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-700 block">
        💬 Query & Instruction History:
      </span>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {queries.map((q, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded text-xs border ${
              q.sender === "Admin"
                ? "bg-amber-50 border-amber-200 text-amber-950"
                : "bg-blue-50 border-blue-200 text-blue-950"
            }`}
          >
            <div className="flex justify-between items-center text-[10px] font-bold mb-1 opacity-80">
              <span>{q.sender === "Admin" ? "🛡️ Plant Admin" : "👷 Shift Operator"}</span>
              <span>{new Date(q.timestamp).toLocaleString()}</span>
            </div>
            <p className="leading-relaxed whitespace-pre-wrap">{q.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// 2. ATTENDANCE PANEL (Operator Live Punch + Admin Manual Override & Shift Filter)
const AttendancePanel = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [msg, setMsg] = useState("");

  // Admin Filter State
  const [filterShift, setFilterShift] = useState<string>("ALL");

  // Operator Live Clock State
  const todayStr = new Date().toISOString().split("T")[0];
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Admin Manual Entry State
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

  // Operator Live Punch
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

  // Admin Manual Entry
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
      setMsg("✓ Manual attendance successfully recorded by Admin!");
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

  // Admin Shift Filtering Logic
  const filteredRecords = records.filter((r) => {
    if (user?.role !== "admin") return true;
    if (filterShift === "ALL") return true;
    return r.shift === filterShift;
  });

  return (
    <div className="space-y-6 mt-4">
      {/* Operator View: Locked Date & Live Time */}
      {user?.role === "shift_user" && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm max-w-xl mx-auto">
          <h3 className="text-base font-black text-slate-800 tracking-tight">
            DAILY SHIFT ATTENDANCE PUNCH
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Official Plant Punch Record (Date and time are locked to live system clock)
          </p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Date (Locked)</label>
              <input
                type="text"
                value={todayStr}
                readOnly
                disabled
                className="w-full bg-slate-100 border border-slate-300 rounded px-3 py-2 text-xs font-bold text-slate-700 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Live Time (Locked)</label>
              <input
                type="text"
                value={currentTime}
                readOnly
                disabled
                className="w-full bg-slate-100 border border-slate-300 rounded px-3 py-2 text-xs font-mono font-bold text-slate-700 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Operator Name</label>
              <input
                type="text"
                value={user.name}
                readOnly
                disabled
                className="w-full bg-slate-100 border border-slate-300 rounded px-3 py-2 text-xs font-bold text-slate-700 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Assigned Shift</label>
              <input
                type="text"
                value={`Shift ${user.assignedShift}`}
                readOnly
                disabled
                className="w-full bg-slate-100 border border-slate-300 rounded px-3 py-2 text-xs font-bold text-indigo-700 cursor-not-allowed"
              />
            </div>
          </div>

          {msg && (
            <div className={`p-2.5 rounded text-xs font-bold mb-3 ${msg.includes("✓") ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
              {msg}
            </div>
          )}

          <button
            onClick={handleOperatorMarkAttendance}
            disabled={marking || hasMarkedToday}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {hasMarkedToday ? "✓ Today's Attendance Already Recorded" : marking ? "Recording..." : "📌 Mark My Attendance Now"}
          </button>
        </div>
      )}

      {/* Admin View: Manual Attendance Override Form */}
      {user?.role === "admin" && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight">
                ADMIN MANUAL ATTENDANCE OVERRIDE
              </h3>
              <p className="text-xs text-slate-500">
                Mark attendance for any operator with custom date, time, and shift.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-extrabold text-[11px] rounded border border-amber-300">
              Admin Privilege
            </span>
          </div>

          <form onSubmit={handleAdminMarkAttendance} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Date</label>
                <input
                  type="date"
                  required
                  value={adminDate}
                  onChange={(e) => setAdminDate(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Punch Time</label>
                <input
                  type="text"
                  required
                  value={adminTime}
                  onChange={(e) => setAdminTime(e.target.value)}
                  placeholder="e.g. 08:15 AM"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-indigo-500 font-semibold font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Shift</label>
                <select
                  value={adminShift}
                  onChange={(e) => setAdminShift(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="A">Shift A</option>
                  <option value="B">Shift B</option>
                  <option value="C">Shift C</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Operator Name</label>
                <input
                  type="text"
                  required
                  value={adminOperatorName}
                  onChange={(e) => setAdminOperatorName(e.target.value)}
                  placeholder="Enter Operator Name"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>
            </div>

            {msg && (
              <div className={`p-2 rounded text-xs font-bold ${msg.includes("✓") ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                {msg}
              </div>
            )}

            <button
              type="submit"
              disabled={marking}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded shadow transition disabled:opacity-50"
            >
              {marking ? "Saving..." : "💾 Mark Operator Attendance"}
            </button>
          </form>
        </div>
      )}

      {/* Attendance Table with Admin Shift Filter Dropdown */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight">
              {user?.role === "admin" ? "PLANT ATTENDANCE MASTER SHEET" : "MY ATTENDANCE HISTORY"}
            </h3>
            <p className="text-xs text-slate-500">
              {user?.role === "admin"
                ? "Filter and view live attendance records by shift"
                : "Your past attendance punches with exact timestamps"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Shift Filter Dropdown for Admin */}
            {user?.role === "admin" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Filter Shift:</span>
                <select
                  value={filterShift}
                  onChange={(e) => setFilterShift(e.target.value)}
                  className="border border-slate-300 rounded px-3 py-1.5 text-xs bg-white font-bold text-indigo-700 focus:outline-none focus:border-indigo-500"
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
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded border border-slate-300"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-500 text-center py-6">Loading records...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            No attendance records found for {filterShift === "ALL" ? "any shift" : `Shift ${filterShift}`}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="p-2.5 border">Date</th>
                  <th className="p-2.5 border">Operator Name</th>
                  <th className="p-2.5 border">Shift</th>
                  <th className="p-2.5 border">Punch Time</th>
                  <th className="p-2.5 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => (
                  <tr key={r._id} className="border-b hover:bg-slate-50">
                    <td className="p-2.5 border font-semibold">{r.date}</td>
                    <td className="p-2.5 border font-bold text-slate-800">{r.operatorName}</td>
                    <td className="p-2.5 border">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded border border-indigo-200">
                        Shift {r.shift}
                      </span>
                    </td>
                    <td className="p-2.5 border font-mono text-slate-600 font-bold">{r.checkInTime}</td>
                    <td className="p-2.5 border">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded text-[10px]">
                        ✓ {r.status}
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

  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const res = await API.get("/plant/reports");
      setReports(res.data);
    } catch (err) {
      console.error("Fetch Reports Error:", err);
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
      alert("Error submitting report: " + (err.response?.data?.message || err.message));
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

  return (
    <div className="space-y-6 mt-4">
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800">Shift {shift} - End of Shift Report</h3>
        <p className="text-xs text-slate-500 mb-3">Operator: {operatorName} | Submit shift work for Admin review.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700">Work Summary</label>
            <textarea
              required
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              className="w-full border border-slate-300 p-2 rounded text-xs mt-1 focus:outline-none focus:border-indigo-500"
              rows={3}
              placeholder="Readings logged, compressor status..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">Issues Faced (Optional)</label>
            <textarea
              value={issuesFaced}
              onChange={(e) => setIssuesFaced(e.target.value)}
              className="w-full border border-slate-300 p-2 rounded text-xs mt-1 focus:outline-none focus:border-indigo-500"
              rows={2}
              placeholder="None"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Shift Report"}
          </button>
        </form>
      </div>

      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-3">My Shift Reports History</h4>
        {loading ? (
          <p className="text-xs text-slate-500 text-center py-4">Loading...</p>
        ) : (
          <div className="space-y-4">
            {reports.map((rep) => (
              <div key={rep._id} className="p-4 border rounded-lg bg-slate-50 text-xs">
                <div className="flex justify-between mb-2">
                  <span className="font-bold">Date: {rep.date}</span>
                  <span className="font-extrabold px-2.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {rep.status === "ACCEPTED" ? "COMPLETED" : rep.status}
                  </span>
                </div>
                <p><strong>Work:</strong> {rep.workSummary}</p>
                <QueryHistoryTimeline queries={rep.queries} />
                {rep.status === "QUERY_RAISED" && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={replyText[rep._id] || ""}
                      onChange={(e) => setReplyText({ ...replyText, [rep._id]: e.target.value })}
                      placeholder="Type response..."
                      className="flex-1 border p-1 rounded text-xs"
                    />
                    <button
                      onClick={() => handleSendCorrection(rep._id)}
                      className="px-3 py-1 bg-indigo-600 text-white font-bold rounded"
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

// 4. ADMIN SHIFT REPORT COMPONENT (With Shift Filter Dropdown)
const AdminReportsList = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterShift, setFilterShift] = useState<string>("ALL");
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

  // Filter Reports by Selected Shift
  const filteredReports = reports.filter((r) => {
    if (filterShift === "ALL") return true;
    return r.shift === filterShift;
  });

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm mt-4">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-800">SHIFT REPORTS REVIEW</h2>
          <p className="text-xs text-slate-500">Filter reports by shift, raise queries, or mark as Completed</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Filter Shift:</span>
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="border border-slate-300 rounded px-3 py-1.5 text-xs bg-white font-bold text-indigo-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Shifts</option>
              <option value="A">Shift A</option>
              <option value="B">Shift B</option>
              <option value="C">Shift C</option>
            </select>
          </div>

          <button
            onClick={fetchReports}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded border border-slate-300"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 py-6 text-center">Loading reports...</p>
      ) : filteredReports.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">
          No reports found for {filterShift === "ALL" ? "any shift" : `Shift ${filterShift}`}.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((rep) => (
            <div key={rep._id} className="p-4 border rounded-lg bg-slate-50 text-xs space-y-2">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded">
                    Shift {rep.shift}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{rep.operatorName}</span>
                  <span className="text-[11px] text-slate-500">({rep.date})</span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                      rep.status === "COMPLETED" || rep.status === "ACCEPTED"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : rep.status === "QUERY_RAISED"
                        ? "bg-rose-100 text-rose-800 border border-rose-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    {rep.status === "ACCEPTED" ? "COMPLETED" : rep.status}
                  </span>
                </div>

                {rep.status !== "COMPLETED" && rep.status !== "ACCEPTED" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveQueryId(activeQueryId === rep._id ? null : rep._id)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded"
                    >
                      💬 Raise Query
                    </button>
                    <button
                      onClick={() => handleCompleteReport(rep._id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded"
                    >
                      ✓ Accept & Complete
                    </button>
                  </div>
                )}
              </div>

              <p><strong>Summary:</strong> {rep.workSummary}</p>
              <QueryHistoryTimeline queries={rep.queries} />

              {activeQueryId === rep._id && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    placeholder="Enter query..."
                    className="flex-1 border p-1 rounded text-xs"
                  />
                  <button
                    onClick={() => handleSendQuery(rep._id)}
                    className="px-3 py-1 bg-amber-600 text-white font-bold rounded"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 5. MAIN APP COMPONENT
export function App() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"attendance" | "air" | "chilling" | "reports">("attendance");

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-800">SMRUTHI ORGANICS LIMITED</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-semibold text-slate-500">Plant Maintenance & Digital Logbook</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              {user.role === "admin" ? "Role: Admin (All Shifts)" : `Shift: ${user.assignedShift} Operator`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === "attendance" ? "bg-white shadow text-indigo-600" : "text-slate-600 hover:text-slate-900"}`}
            >
              📌 Attendance
            </button>
            <button
              onClick={() => setActiveTab("air")}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === "air" ? "bg-white shadow text-indigo-600" : "text-slate-600 hover:text-slate-900"}`}
            >
              Air Compressor
            </button>
            <button
              onClick={() => setActiveTab("chilling")}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === "chilling" ? "bg-white shadow text-indigo-600" : "text-slate-600 hover:text-slate-900"}`}
            >
              Chilling Compressor
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === "reports" ? "bg-white shadow text-indigo-600" : "text-slate-600 hover:text-slate-900"}`}
            >
              {user.role === "admin" ? "📋 Shift Reports Review" : "📋 My Shift Reports"}
            </button>
          </div>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="text-right">
              <span className="block text-xs font-bold text-slate-800">{user.name}</span>
              <span className="block text-[10px] text-slate-500 capitalize">{user.role}</span>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-md transition border border-red-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-6">
        {activeTab === "attendance" && <AttendancePanel />}
        {activeTab === "air" && <AirCompressorTable />}
        {activeTab === "chilling" && <ChillingTable />}
        {activeTab === "reports" && (
          user.role === "admin" ? (
            <AdminReportsList />
          ) : (
            <OperatorShiftReportSection
              shift={user.assignedShift}
              operatorName={user.name}
            />
          )
        )}
      </main>
    </div>
  );
}

export default App;