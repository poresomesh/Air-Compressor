import React from "react";
import type { ChillingSummaryData } from "../../types/chillingCompressor";

interface Props {
  summary: ChillingSummaryData;
}

export const ChillingSummary: React.FC<Props> = ({ summary }) => {
  return (
    <div className="grid grid-cols-3 gap-4 mt-4">
      <div className="bg-cyan-50 border border-cyan-200 p-3 rounded-lg text-center">
        <span className="text-xs text-cyan-700 block uppercase font-bold">Chiller ΔT (Inlet - Outlet)</span>
        <span className="text-xl font-black text-slate-800">{summary.deltaT} °C</span>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
        <span className="text-xs text-emerald-700 block uppercase font-bold">Total KWH Consumed</span>
        <span className="text-xl font-black text-slate-800">{summary.totalEnergyConsumed} Units</span>
      </div>
      <div className="bg-violet-50 border border-violet-200 p-3 rounded-lg text-center">
        <span className="text-xs text-violet-700 block uppercase font-bold">Total Run Hours</span>
        <span className="text-xl font-black text-slate-800">{summary.totalRunHours} Hrs</span>
      </div>
    </div>
  );
};