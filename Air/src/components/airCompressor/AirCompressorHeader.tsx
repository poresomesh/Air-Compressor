import React from "react";
import { useAuth } from "../../context/AuthContext";

interface Props {
  date: string;
  setDate: (d: string) => void;
  shift: string;
  setShift: (s: string) => void;
}

export const AirCompressorHeader: React.FC<Props> = ({ date, setDate, shift, setShift }) => {
  const { user } = useAuth();

  return (
    <div className="flex flex-wrap gap-4 items-center mb-5 bg-slate-50 p-3 rounded-lg border border-slate-200">
      <div>
        <label className="block text-[11px] font-bold text-slate-600 mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-600 mb-1">Shift</label>
        {user?.role === "admin" ? (
          <select
            value={shift}
            onChange={(e) => setShift(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white focus:outline-none focus:border-indigo-500 font-semibold"
          >
            <option value="A">Shift A</option>
            <option value="B">Shift B</option>
            <option value="C">Shift C</option>
          </select>
        ) : (
          <div className="flex items-center gap-1">
            <span className="border border-slate-300 bg-white text-indigo-700 font-black px-3 py-1 rounded text-xs">
              Shift {user?.assignedShift}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">🔒</span>
          </div>
        )}
      </div>
    </div>
  );
};