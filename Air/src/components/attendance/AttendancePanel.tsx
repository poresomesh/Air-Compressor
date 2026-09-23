import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { TimeFilterTabs } from "../common/TimeFilterTabs";
import { isDateInPeriod, TimeFilterPeriod } from "../../utils/dateFilters";
import API from "../../utils/api";

export const AttendancePanel: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [msg, setMsg] = useState("");

  const [filterShift, setFilterShift] = useState<string>("ALL");
  const [activePeriod, setActivePeriod] = useState<TimeFilterPeriod>("today");

  const todayStr = new Date().toISOString().split("T")[0];
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // 1. Operator swatahache naav type/edit karu shakto
  const [operatorCustomName, setOperatorCustomName] = useState(user?.name || "");

  // 2. Admin Manual Override Form States
  const [adminDate, setAdminDate] = useState(todayStr);
  const [adminTime, setAdminTime] = useState("08:00 AM");
  const [adminOperatorName, setAdminOperatorName] = useState("");
  const [adminShift, setAdminShift] = useState("A");

  useEffect(() => {
    if (user?.name) {
      setOperatorCustomName(user.name);
    }
  }, [user]);

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
      if (Array.isArray(res.data)) {
        setRecords(res.data);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error("Fetch Attendance Error:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // Operator punch kartana input madhle typed custom naav aani shift backend la pathvne
  const handleOperatorMarkAttendance = async () => {
    if (!operatorCustomName.trim()) {
      alert("Krupaya Operator che naav taka!");
      return;
    }

    setMarking(true);
    setMsg("");
    try {
      await API.post("/plant/attendance", {
        operatorName: operatorCustomName.trim(),
        shift: user?.assignedShift || "A",
        date: todayStr,
      });
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
      alert("Krupaya Operator che naav taka.");
      return;
    }
    setMarking(true);
    setMsg("");
    try {
      await API.post("/plant/attendance", {
        operatorName: adminOperatorName,
        shift: adminShift,
        date: adminDate,
        checkInTime: adminTime,
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

  const hasMarkedToday = Array.isArray(records)
    ? records.some(
        (r) => r.date === todayStr && (r.userId === (user?.id || (user as any)?._id) || r.operatorName === operatorCustomName)
      )
    : false;

  const filteredRecords = useMemo(() => {
    if (!Array.isArray(records)) return [];
    return records.filter((r) => {
      if (user?.role === "admin" && filterShift !== "ALL" && r.shift !== filterShift) {
        return false;
      }
      return isDateInPeriod(r.date, activePeriod);
    });
  }, [records, user?.role, filterShift, activePeriod]);

  const periodCounts = useMemo(() => {
    if (!Array.isArray(records)) {
      return { today: 0, week: 0, month: 0, year: 0 };
    }
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
      {/* 5 CONTENT PUNCH CARD FOR SHIFT USER */}
      {user?.role === "shift_user" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-6 max-w-2xl mx-auto backdrop-blur-md">
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
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-extrabold rounded-lg text-xs border border-indigo-100">
              Shift {user.assignedShift}
            </span>
          </div>

          {/* 5 INPUT FIELDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mb-5">
            {/* Field 1: Calendar Date */}
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

            {/* Field 2: Live Precision Clock */}
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

            {/* Field 3: Assigned Shift (Default login shift) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Current Shift
              </label>
              <input
                type="text"
                value={`Shift ${user.assignedShift || "A"}`}
                readOnly
                disabled
                className="w-full bg-indigo-50/50 border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-700 cursor-not-allowed"
              />
            </div>

            {/* Field 4: Operator Name (Editable - User can change) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                <span>Operator Name</span>
                <span className="text-[9px] text-indigo-600 font-semibold">(Editable)</span>
              </label>
              <input
                type="text"
                value={operatorCustomName}
                onChange={(e) => setOperatorCustomName(e.target.value)}
                placeholder="Enter Operator Name"
                className="w-full bg-white border border-indigo-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition shadow-sm"
              />
            </div>

            {/* Field 5: Designated Station */}
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

      {/* ADMIN MANUAL ATTENDANCE OVERRIDE */}
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

      {/* PLANT ATTENDANCE MASTER SHEET */}
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
                    {/* Operator ne je naav takle ahe te ith sheet madhe disel */}
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {r.operatorName || r.userId?.name || user?.name || "Operator"}
                    </td>
                    {/* Jya shift madhe punch zala te badge ith disel */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold rounded-full text-[10px] border border-indigo-100">
                        Shift {r.shift || user?.assignedShift || "A"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 font-bold">{r.checkInTime}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold rounded-full text-[10px] border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {r.status || "PRESENT"}
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