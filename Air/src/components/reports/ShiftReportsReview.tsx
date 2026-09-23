import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { AdminReportPanel } from "./AdminReportPanel";
import { ShiftReportForm, ShiftReportData } from "./ShiftReportForm";
import { TimeFilterTabs } from "../common/TimeFilterTabs";
import { isDateInPeriod, TimeFilterPeriod } from "../../utils/dateFilters";
import { AdminShiftCompliance } from "../alerts/AdminShiftCompliance";
import API from "../../utils/api";

export const ShiftReportsReview: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [reports, setReports] = useState<ShiftReportData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");

  const [activePeriod, setActivePeriod] = useState<TimeFilterPeriod>("today");
  const [selectedShift, setSelectedShift] = useState<string>("ALL");

  const today = new Date().toISOString().split("T")[0];

  const fetchReports = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await API.get("/plant/reports");
      const data = (Array.isArray(res.data) ? res.data : []).map((item: any) => ({
        ...item,
        status:
          item.status === "COMPLETED" || item.status === "ACCEPTED"
            ? "COMPLETED"
            : item.status
      }));
      setReports(data);
    } catch {
      setReports([]);
      setMsg("Failed to load shift reports ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // 1. Operator Submits New Report
  const handleSubmitReport = async (data: {
    shift: string;
    operatorName: string;
    workSummary: string;
    issuesFaced: string;
    date: string;
  }) => {
    try {
      const res = await API.post("/plant/reports", data);
      setMsg("Report successfully submitted to Admin! Status: PENDING review.");
      if (res.data) {
        setReports((prev) => [res.data, ...prev]);
      }
      await fetchReports();
    } catch (err: any) {
      const errorText = err.response?.data?.message || err.message || "Failed to submit report";
      alert("Submit Error: " + errorText);
      throw err;
    }
  };

  // 2. Operator Replies to Admin Query
  const handleSendQueryReply = async (reportId: string, replyMessage: string) => {
    try {
      await API.patch(`/plant/reports/${reportId}`, {
        newQueryMessage: replyMessage,
        sender: user?.name || "Operator",
        status: "PENDING"
      });
      setMsg("Reply sent to Admin! Status changed to PENDING.");
      await fetchReports();
    } catch (err: any) {
      alert("Error sending reply: " + (err.response?.data?.message || err.message));
      throw err;
    }
  };

  // 3. Admin Accepts Report -> Completed & Closed
  const handleAccept = async (id: string) => {
    try {
      await API.patch(`/plant/reports/${id}/accept`);
      setMsg("Report approved! Shift status is officially COMPLETED.");
      await fetchReports();
    } catch (err: any) {
      alert("Error accepting report: " + (err.response?.data?.message || err.message));
    }
  };

  // 4. Admin Raises Query
  const handleRaiseQuery = async (id: string, queryMessage: string) => {
    try {
      await API.patch(`/plant/reports/${id}`, {
        newQueryMessage: queryMessage,
        sender: "Admin",
        status: "QUERY_RAISED"
      });
      setMsg("Clarification query sent to operator!");
      await fetchReports();
    } catch (err: any) {
      alert("Error raising query: " + (err.response?.data?.message || err.message));
    }
  };

  // 5. Admin Deletes Report
  const handleDeleteReport = async (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm("Are you sure you want to permanently delete this shift report?")) {
      return;
    }

    try {
      await API.delete(`/plant/reports/${id}`);
      setMsg("Shift report removed successfully.");
      setReports((prev) => prev.filter((r) => r._id !== id));
    } catch (err: any) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  // Operator Shift & Reports Matching
  const rawShift = user?.assignedShift || "";
  const cleanShift = rawShift.replace(/Shift\s*/i, "").trim().toUpperCase() || "A";

  const userReports = reports.filter((r) => {
    const rShift = (r.shift || "").replace(/Shift\s*/i, "").trim().toUpperCase();
    return rShift === cleanShift || r.shift === rawShift;
  });

  // Today's active report: Prioritize uncompleted (Pending / Query Raised)
  const userTodayReport =
    userReports.find(
      (r) => r.date === today && (r.status === "PENDING" || r.status === "QUERY_RAISED")
    ) ||
    userReports.find((r) => r.date === today) ||
    null;

  // Filtered reports for Admin
  const filteredReports = reports.filter((rep) => {
    const repShift = (rep.shift || "").replace(/Shift\s*/i, "").trim().toUpperCase();
    const matchShift = selectedShift === "ALL" || repShift === selectedShift;
    const matchPeriod = isDateInPeriod(rep.date, activePeriod);
    return matchShift && matchPeriod;
  });

  return (
    <div className="space-y-6">
      {isAdmin && <AdminShiftCompliance />}

      {msg && (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-xl shadow-xs flex items-center justify-between">
          <span>{msg}</span>
          <button
            onClick={() => setMsg("")}
            className="text-indigo-400 hover:text-indigo-600 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {isAdmin ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-100 gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                SHIFT REPORTS AUDIT & REVIEW
              </h2>
              <p className="text-xs text-slate-500">
                Verify handover reports by time period, raise queries, and grant final sign-offs
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <TimeFilterTabs activePeriod={activePeriod} onPeriodChange={setActivePeriod} />

              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600">Shift:</span>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="text-xs font-bold text-indigo-700 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Shifts</option>
                  <option value="A">Shift A</option>
                  <option value="B">Shift B</option>
                  <option value="C">Shift C</option>
                </select>
              </div>

              <button
                onClick={fetchReports}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10 text-xs text-slate-400 font-semibold">
              Auditing reports ledger...
            </div>
          ) : (
            <AdminReportPanel
              reports={filteredReports}
              onAccept={handleAccept}
              onRaiseQuery={handleRaiseQuery}
              onDelete={handleDeleteReport}
            />
          )}
        </div>
      ) : (
        /* Operator View: Form + History Table */
        <div className="space-y-6">
          <ShiftReportForm
            shift={user?.assignedShift || "A"}
            operatorName={user?.name || "Operator"}
            existingReport={userTodayReport}
            reportHistory={userReports}
            onSubmit={handleSubmitReport}
            onSendQueryReply={handleSendQueryReply}
          />
        </div>
      )}
    </div>
  );
};