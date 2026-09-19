import React from "react";

export interface ShiftReportItem {
  _id: string;
  shift: string;
  date: string;
  operatorName: string;
  workSummary: string;
  issuesFaced?: string;
  status: "PENDING" | "ACCEPTED";
}

interface Props {
  reports: ShiftReportItem[];
  onAccept: (id: string) => void;
}

export const AdminReportPanel: React.FC<Props> = ({ reports, onAccept }) => {
  return (
    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm mt-6">
      <h3 className="text-base font-bold text-slate-800 mb-3">Shift Reports (Review & Accept)</h3>
      <div className="space-y-3">
        {reports.length === 0 ? (
          <p className="text-xs text-slate-400">Navin shift reports ajun aaleli nahit.</p>
        ) : (
          reports.map((rep) => (
            <div key={rep._id} className="p-3 border border-slate-200 rounded-lg bg-slate-50 flex justify-between items-start">
              <div>
                <div className="flex gap-2 items-center mb-1">
                  <span className="bg-indigo-100 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded">
                    Shift {rep.shift}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">{rep.operatorName}</span>
                  <span className="text-[10px] text-slate-500">({rep.date})</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${rep.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {rep.status}
                  </span>
                </div>
                <p className="text-xs text-slate-800 mt-1"><strong>Kaam:</strong> {rep.workSummary}</p>
                {rep.issuesFaced && rep.issuesFaced !== "None" && (
                  <p className="text-xs text-red-600 mt-0.5"><strong>Issue:</strong> {rep.issuesFaced}</p>
                )}
              </div>

              {rep.status === "PENDING" && (
                <button
                  onClick={() => onAccept(rep._id)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow transition"
                >
                  Accept
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};