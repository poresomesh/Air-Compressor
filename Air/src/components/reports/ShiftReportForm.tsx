import React, { useState } from "react";

interface Props {
  shift: string;
  operatorName: string;
  onSubmit: (data: { shift: string; operatorName: string; workSummary: string; issuesFaced: string; date: string }) => void;
}

export const ShiftReportForm: React.FC<Props> = ({ shift, operatorName, onSubmit }) => {
  const [workSummary, setWorkSummary] = useState("");
  const [issuesFaced, setIssuesFaced] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      shift,
      operatorName,
      workSummary,
      issuesFaced,
      date: new Date().toISOString().split("T")[0]
    });
    setSent(true);
  };

  return (
    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm mt-6">
      <h3 className="text-base font-bold text-slate-800">Shift {shift} - End of Shift Report</h3>
      <p className="text-xs text-slate-500 mb-3">Shift samplyavar aaj kelele kaam fill karun pathva. Admin kade he report review sathi jail.</p>

      {sent ? (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-md">
          ✓ Report Admin kade pathavle ahe!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700">Aaj kay kay kaam kel? (Summary)</label>
            <textarea
              required
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              className="w-full border border-slate-300 p-2 rounded text-xs mt-1 focus:outline-none focus:border-indigo-500"
              rows={3}
              placeholder="Udaharanarth: Hourly readings ghetli, oil pressure monitor kela..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Kahi Breakdown / Issue aala ka?</label>
            <textarea
              value={issuesFaced}
              onChange={(e) => setIssuesFaced(e.target.value)}
              className="w-full border border-slate-300 p-2 rounded text-xs mt-1 focus:outline-none focus:border-indigo-500"
              rows={2}
              placeholder="Kahi issue nasel tar 'None' theva..."
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 transition"
          >
            Submit Report to Admin
          </button>
        </form>
      )}
    </div>
  );
};