import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { Login } from "./components/auth/Login";
import { AttendancePanel } from "./components/attendance/AttendancePanel";
import { AirCompressorTable } from "./components/airCompressor/AirCompressorTable";
import { ChillingTable } from "./components/chillingCompressor/ChillingTable";
import { DgLogBookTable } from "./components/dgLogBook/DgLogBookTable";
import { PowerFailureTable } from "./components/powerFailure/PowerFailureTable";
import { ShiftReportsReview } from "./components/reports/ShiftReportsReview";
import { ShiftAlertBanner } from "./components/alerts/ShiftAlertBanner";

// 1. TOP METRICS STRIP
const PlantStatusHeader = ({ role, shift }: { role: string; shift?: string }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
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

      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
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

      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
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

      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
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

// 2. MAIN APP CONTAINER
export function App() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "attendance" | "air" | "chilling" | "dg" | "power" | "reports"
  >("attendance");

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-16 font-sans">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20 shadow-lg px-6 lg:px-10 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5 shrink-0">
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

          {/* Navigation Tabs (Single Clean Row) */}
          <div className="flex items-center gap-3">
            <div className="hidden xl:flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 text-xs font-bold shadow-inner">
              <button
                onClick={() => setActiveTab("attendance")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "attendance" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                }`}
              >
                📌 Attendance
              </button>
              <button
                onClick={() => setActiveTab("air")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "air" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                }`}
              >
                Air Compressor
              </button>
              <button
                onClick={() => setActiveTab("chilling")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "chilling" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                }`}
              >
                Chilling Compressor
              </button>
              <button
                onClick={() => setActiveTab("dg")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "dg" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                }`}
              >
                ⚡ DG Log Book
              </button>
              <button
                onClick={() => setActiveTab("power")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "power" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                }`}
              >
                🔌 Power Failure
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "reports" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                }`}
              >
                📑 Shift Reports Review
              </button>
            </div>

            {/* User Details & Logout Button */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800 shrink-0">
              <div className="text-right">
                <span className="block text-xs font-bold text-white">{user.name}</span>
                <span className="block text-[10px] font-mono text-indigo-300 uppercase">
                  {user.role === "admin" ? "Plant Admin" : `Shift ${user.assignedShift}`}
                </span>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold rounded-xl transition border border-rose-500/20 cursor-pointer"
              >
                Logout
              </button>
            </div>

          </div>

        </div>

        {/* Mobile / Medium screen scrollable nav */}
        <div className="flex xl:hidden items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 text-xs font-bold overflow-x-auto mt-3">
          <button onClick={() => setActiveTab("attendance")} className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === "attendance" ? "bg-indigo-600 text-white" : "text-slate-300"}`}>📌 Attendance</button>
          <button onClick={() => setActiveTab("air")} className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === "air" ? "bg-indigo-600 text-white" : "text-slate-300"}`}>Air Compressor</button>
          <button onClick={() => setActiveTab("chilling")} className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === "chilling" ? "bg-indigo-600 text-white" : "text-slate-300"}`}>Chilling</button>
          <button onClick={() => setActiveTab("dg")} className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === "dg" ? "bg-indigo-600 text-white" : "text-slate-300"}`}>⚡ DG Log</button>
          <button onClick={() => setActiveTab("power")} className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === "power" ? "bg-indigo-600 text-white" : "text-slate-300"}`}>🔌 Power</button>
          <button onClick={() => setActiveTab("reports")} className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === "reports" ? "bg-indigo-600 text-white" : "text-slate-300"}`}>📑 Reports</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-10 pt-6">
        {/* Top KPI Cards */}
        <PlantStatusHeader role={user.role} shift={user.assignedShift} />

        {/* Operator Hourly Reading Alert (Shift report accept jhalyavar auto-stop hoil) */}
        <ShiftAlertBanner />

        {/* Tab Components: Attendance page neat aani clean disel */}
        {activeTab === "attendance" && <AttendancePanel />}
        {activeTab === "air" && <AirCompressorTable />}
        {activeTab === "chilling" && <ChillingTable />}
        {activeTab === "dg" && <DgLogBookTable />}
        {activeTab === "power" && <PowerFailureTable />}
        {activeTab === "reports" && <ShiftReportsReview />}
      </main>
    </div>
  );
}

export default App;