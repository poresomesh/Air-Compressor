import React, { useState } from "react";
import { ShiftReportData } from "./ShiftReportForm";

interface Props {
  reports: ShiftReportData[];
  onAccept: (id: string) => void;
  onRaiseQuery: (id: string, message: string) => void;
  onDelete: (id: string) => void;
}

export const AdminReportPanel: React.FC<Props> = ({
  reports,
  onAccept,
  onRaiseQuery,
  onDelete
}) => {
  const [queryInputs, setQueryInputs] = useState<{ [id: string]: string }>({});
  const [activeQueryBoxId, setActiveQueryBoxId] = useState<string | null>(null);

  const handleQuerySend = (id: string) => {
    const text = queryInputs[id]?.trim();
    if (!text) return;
    onRaiseQuery(id, text);
    setQueryInputs((prev) => ({ ...prev, [id]: "" }));
    setActiveQueryBoxId(null);
  };

  return (
    <div className="space-y-3">
      {reports.length === 0 ? (
        <div className="text-center py-10 text-xs text-slate-400 font-medium">
          No shift reports available for this filter.
        </div>
      ) : (
        reports.map((rep) => {
          const isCompleted = rep.status === "COMPLETED" || rep.status === "ACCEPTED";
          const isQueryRaised = rep.status === "QUERY_RAISED";

          return (
            <div
              key={rep._id}
              className="p-4 border border-slate-200/80 rounded-2xl bg-white shadow-xs space-y-3 transition hover:border-slate-300"
            >
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-black px-2.5 py-0.5 rounded-lg">
                      Shift {rep.shift}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{rep.operatorName}</span>
                    <span className="text-[11px] font-mono text-slate-400">({rep.date})</span>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase border ${
                        isCompleted
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : isQueryRaised
                          ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {isCompleted
                        ? "COMPLETED"
                        : isQueryRaised
                        ? "QUERY RAISED"
                        : "PENDING"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 mt-2 font-medium">
                    <strong className="text-slate-900">Work Summary:</strong> {rep.workSummary}
                  </p>
                  {rep.issuesFaced && rep.issuesFaced !== "None" && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">
                      <strong>Breakdown / Issue:</strong> {rep.issuesFaced}
                    </p>
                  )}
                </div>

                {/* Actions: Accept, Raise Query ani Delete */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isCompleted && (
                    <>
                      <button
                        onClick={() =>
                          setActiveQueryBoxId(activeQueryBoxId === rep._id ? null : rep._id)
                        }
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        ❓ Raise Query
                      </button>
                      <button
                        onClick={() => onAccept(rep._id)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                      >
                        ✓ Accept & Close
                      </button>
                    </>
                  )}

                  {/* Delete Button (Always available for Admin) */}
                  <button
                    onClick={() => onDelete(rep._id)}
                    className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
                    title="Delete this report"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* Chat Thread if queries exist */}
              {rep.queries && rep.queries.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 mt-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">
                    Communication Log:
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {rep.queries.map((q, idx) => (
                      <div
                        key={idx}
                        className={`text-xs p-2 rounded-lg ${
                          q.sender === "Admin"
                            ? "bg-rose-50 text-rose-900 border border-rose-100"
                            : "bg-indigo-50 text-indigo-900 border border-indigo-100"
                        }`}
                      >
                        <strong>{q.sender}:</strong> {q.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Query Input Box for Admin */}
              {activeQueryBoxId === rep._id && (
                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-amber-900">
                    Operator sathi query kiva clarification pathva:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="E.g. 15:00 che pressure reading kami kase aale? Check kara."
                      value={queryInputs[rep._id] || ""}
                      onChange={(e) =>
                        setQueryInputs({ ...queryInputs, [rep._id]: e.target.value })
                      }
                      className="flex-1 border border-slate-300 rounded-xl px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={() => handleQuerySend(rep._id)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Send Query
                    </button>
                    <button
                      onClick={() => setActiveQueryBoxId(null)}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};