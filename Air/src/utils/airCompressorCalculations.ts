import type { AirCompressorEntry, AirCompressorSummaryData } from "../types/airCompressor";

export const calculateAirCompressorStats = (rows: AirCompressorEntry[]): AirCompressorSummaryData => {
  const validTemps = rows.map(r => Number(r.temperature)).filter(v => !isNaN(v) && v > 0);
  const validPressures = rows.map(r => Number(r.airPressure)).filter(v => !isNaN(v) && v > 0);

  const avgTemperature = validTemps.length 
    ? Number((validTemps.reduce((a, b) => a + b, 0) / validTemps.length).toFixed(2)) 
    : 0;

  const avgAirPressure = validPressures.length 
    ? Number((validPressures.reduce((a, b) => a + b, 0) / validPressures.length).toFixed(2)) 
    : 0;

  const maxTemperature = validTemps.length ? Math.max(...validTemps) : 0;

  return { avgTemperature, avgAirPressure, maxTemperature };
};