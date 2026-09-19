import React from "react";
import type { AirCompressorSummaryData } from "../../types/airCompressor";

interface Props {
  summary: AirCompressorSummaryData;
}

export const AirCompressorSummary: React.FC<Props> = ({ summary }) => {
  return (
    <div className="grid grid-cols-3 gap-4 mt-4">
      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
        <span className="text-xs text-blue-600 block uppercase font-bold">Avg Temperature</span>
        <span className="text-xl font-black text-slate-800">{summary.avgTemperature} °C</span>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
        <span className="text-xs text-emerald-600 block uppercase font-bold">Avg Air Pressure</span>
        <span className="text-xl font-black text-slate-800">{summary.avgAirPressure} Kg/cm²</span>
      </div>
      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-center">
        <span className="text-xs text-amber-600 block uppercase font-bold">Max Temperature</span>
        <span className="text-xl font-black text-slate-800">{summary.maxTemperature} °C</span>
      </div>
    </div>
  );
};