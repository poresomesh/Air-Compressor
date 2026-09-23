import React, { useState } from "react";

export interface ShiftReportData {
  _id: string;
  shift: string;
  date: string;
  operatorName: string;
  workSummary: string;
  issuesFaced?: string;
  status: "PENDING" | "QUERY_RAISED" | "COMPLETED" | "ACCEPTED";
  queries?: {
    sender: string;
    message: string;
    timestamp: string;
  }[];
}

interface Props {
  shift: string;
  operatorName: string;
  existingReport?: ShiftReportData | null;
  reportHistory: ShiftReportData[];
  onSubmit: (data: {
    shift: string;
    operatorName: string;
    workSummary: string;
    issuesFaced: string;
    date: string;
  }) => Promise<void>;
  onSendQueryReply?: (reportId: string, message: string) => Promise<void>;
}

export const ShiftReportForm: React.FC<Props> = ({
  shift,
  operatorName,
  existingReport,
  reportHistory,
  onSubmit,
  onSendQueryReply
}) => {
  const [workSummary, setWorkSummary] = useState("");
  const [issuesFaced, setIssuesFaced] = useState("");
  const [replyMsg, setReplyMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [openNewForm, setOpenNewForm] = useState(false);

  // Selected report for popup modal view
  const [selectedModalReport, setSelectedModalReport] = useState<ShiftReportData | null>(null);

  const cleanShift = shift.replace(/Shift\s*/i, "").trim().toUpperCase() || "A";

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workSummary.trim()) {
      alert("Please enter details in the Work Summary field.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        shift: cleanShift,
        operatorName: operatorName || "Operator",
        workSummary: workSummary.trim(),
        issuesFaced: issuesFaced.trim() || "None",
        date: new Date().toISOString().split("T")[0]
      });
      setWorkSummary("");
      setIssuesFaced("");
      setOpenNewForm(false);
    } catch (err: any) {
      console.error("Submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMsg.trim() || !existingReport || !onSendQueryReply) return;
    setIsReplying(true);
    try {
      await onSendQueryReply(existingReport._id, replyMsg.trim());
      setReplyMsg("");
    } catch (err: any) {
      console.error("Reply error:", err);
    } finally {
      setIsReplying(false);
    }
  };

  const isCompleted =
    existingReport?.status === "COMPLETED" || existingReport?.status === "ACCEPTED";
  const isQueryRaised = existingReport?.status === "QUERY_RAISED";

  return (
    <div className="space-y-6">
      {/* 1. ACTIVE REPORT / ENTRY FORM */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight">
              Shift {cleanShift} — End of Shift Handover Report
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit daily shift operations summary and machinery status to Plant Admin.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {existingReport && !openNewForm && (
              <span
                className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                  isCompleted
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : isQueryRaised
                    ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {isCompleted
                  ? "✓ COMPLETED (SHIFT CLOSED)"
                  : isQueryRaised
                  ? "⚠️ QUERY RAISED BY ADMIN"
                  : "⏳ PENDING ADMIN REVIEW"}
              </span>
            )}

            {existingReport && (
              <button
                type="button"
                onClick={() => setOpenNewForm(!openNewForm)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                {openNewForm ? "← View Active Report" : "+ Submit New Report"}
              </button>
            )}
          </div>
        </div>

        {/* Existing Active Report Card */}
        {existingReport && !openNewForm ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2.5">
              <div className="flex justify-between items-center text-slate-500 font-semibold border-b border-slate-200/60 pb-2">
                <span>Date: <strong className="text-slate-800">{existingReport.date}</strong></span>
                <span>Operator: <strong className="text-slate-800">{existingReport.operatorName}</strong></span>
              </div>
              <div>
                <strong className="text-slate-800">Work Summary:</strong>
                <p className="text-slate-700 mt-1 bg-white p-3 rounded-xl border border-slate-200 font-medium">
                  {existingReport.workSummary}
                </p>
              </div>
              {existingReport.issuesFaced && existingReport.issuesFaced !== "None" && (
                <div>
                  <strong className="text-rose-700">Issues / Breakdowns:</strong>
                  <p className="text-rose-600 mt-1 bg-white p-3 rounded-xl border border-rose-100 font-medium">
                    {existingReport.issuesFaced}
                  </p>
                </div>
              )}
            </div>

            {/* Admin Query Communications */}
            {existingReport.queries && existingReport.queries.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                  💬 Direct Communication Log with Admin
                </h4>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {existingReport.queries.map((q, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl text-xs ${
                        q.sender === "Admin"
                          ? "bg-rose-100/80 border border-rose-200 text-rose-950 ml-0 mr-8"
                          : "bg-indigo-100/80 border border-indigo-200 text-indigo-950 ml-8 mr-0 text-right"
                      }`}
                    >
                      <div className="font-bold text-[10px] uppercase opacity-75">
                        {q.sender} • {new Date(q.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <p className="mt-1 font-semibold">{q.message}</p>
                    </div>
                  ))}
                </div>

                {!isCompleted && (
                  <form onSubmit={handleReplySubmit} className="flex gap-2 pt-2 border-t border-amber-200">
                    <input
                      type="text"
                      required
                      placeholder="Write clarification or explanation to Admin..."
                      value={replyMsg}
                      onChange={(e) => setReplyMsg(e.target.value)}
                      className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-indigo-500 font-medium"
                    />
                    <button
                      type="submit"
                      disabled={isReplying}
                      className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      {isReplying ? "Sending..." : "Send Reply"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {isCompleted && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between">
                <span>✓ Report has been verified and accepted by Admin. Shift is officially completed and closed.</span>
                <button
                  type="button"
                  onClick={() => setOpenNewForm(true)}
                  className="underline hover:text-emerald-950 font-black cursor-pointer text-xs"
                >
                  + Submit another report update
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Report Submission Form */
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">
                📝 New Handover Report Entry
              </span>
              {existingReport && (
                <button
                  type="button"
                  onClick={() => setOpenNewForm(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Cancel (Return to active report)
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Work Summary (Tasks Performed): <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={workSummary}
                onChange={(e) => setWorkSummary(e.target.value)}
                placeholder="Detail hourly readings, compressor inspections, power switchover activities..."
                className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Issues / Breakdowns Encountered:
              </label>
              <textarea
                rows={2}
                value={issuesFaced}
                onChange={(e) => setIssuesFaced(e.target.value)}
                placeholder="Enter breakdown details or leave as 'None'..."
                className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Submitting Report...</span>
                  </>
                ) : (
                  <span>Submit Report to Admin</span>
                )}
              </button>

              {existingReport && (
                <button
                  type="button"
                  onClick={() => setOpenNewForm(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* 2. OPERATOR SHIFT HANDOVER HISTORY TABLE (CLICKABLE ROWS) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-black text-slate-800 tracking-tight">
              📋 Your Shift Handover Report History
            </h4>
            <p className="text-xs text-slate-500">
              Click on any row below to view its full details and admin communications.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
            Total: {reportHistory.length}
          </span>
        </div>

        {reportHistory.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 font-semibold">
            No previous reports recorded for your shift.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Shift</th>
                  <th className="py-2.5 px-3">Operator</th>
                  <th className="py-2.5 px-3">Work Summary</th>
                  <th className="py-2.5 px-3">Breakdown</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {reportHistory.map((rep) => {
                  const isRepCompleted =
                    rep.status === "COMPLETED" || rep.status === "ACCEPTED";
                  const isRepQuery = rep.status === "QUERY_RAISED";

                  return (
                    <tr
                      key={rep._id}
                      onClick={() => setSelectedModalReport(rep)}
                      className="hover:bg-indigo-50/50 cursor-pointer transition"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{rep.date}</td>
                      <td className="py-3 px-3">
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-[10px] font-black">
                          Shift {rep.shift}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold">{rep.operatorName}</td>
                      <td className="py-3 px-3 max-w-xs truncate" title={rep.workSummary}>
                        {rep.workSummary}
                      </td>
                      <td className="py-3 px-3">
                        {rep.issuesFaced && rep.issuesFaced !== "None" ? (
                          <span className="text-rose-600 font-semibold">{rep.issuesFaced}</span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${
                            isRepCompleted
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isRepQuery
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {isRepCompleted
                            ? "COMPLETED"
                            : isRepQuery
                            ? "QUERY RAISED"
                            : "PENDING"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] underline">
                          View Details ↗
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. REPORT DETAIL MODAL POPUP WITH CLOSE (X) BUTTON */}
      {selectedModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-base">📄</span>
                <div>
                  <h3 className="text-sm font-black tracking-tight">
                    Report Details — Shift {selectedModalReport.shift}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Logged on {selectedModalReport.date} by {selectedModalReport.operatorName}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedModalReport(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition font-black text-sm cursor-pointer"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="text-xs text-slate-500">
                  Status:
                  <span
                    className={`ml-2 px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${
                      selectedModalReport.status === "COMPLETED" || selectedModalReport.status === "ACCEPTED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : selectedModalReport.status === "QUERY_RAISED"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {selectedModalReport.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  ID: {selectedModalReport._id}
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">
                  Work Summary
                </label>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedModalReport.workSummary}
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">
                  Breakdown / Issues Encountered
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-rose-600">
                  {selectedModalReport.issuesFaced || "None"}
                </div>
              </div>

              {/* Communication Thread */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">
                  Communication Log with Admin
                </label>
                {selectedModalReport.queries && selectedModalReport.queries.length > 0 ? (
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-44 overflow-y-auto">
                    {selectedModalReport.queries.map((q, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl text-xs ${
                          q.sender === "Admin"
                            ? "bg-rose-100/80 border border-rose-200 text-rose-950"
                            : "bg-indigo-100/80 border border-indigo-200 text-indigo-950 text-right"
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase opacity-75">
                          {q.sender} • {new Date(q.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <p className="mt-0.5 font-semibold">{q.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                    No query communications for this report.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedModalReport(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};