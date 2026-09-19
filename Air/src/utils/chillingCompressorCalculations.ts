import type { ChillingEntry, ChillingSummaryData } from "../types/chillingCompressor";

export const calculateChillingStats = (rows: ChillingEntry[]): ChillingSummaryData => {
  const validKwh = rows.map(r => Number(r.kwh)).filter(v => !isNaN(v) && v > 0);
  const validHours = rows.map(r => Number(r.runHours)).filter(v => !isNaN(v) && v > 0);

  const totalEnergyConsumed = validKwh.length >= 2 
    ? Number((validKwh[validKwh.length - 1] - validKwh[0]).toFixed(2)) 
    : 0;

  const totalRunHours = validHours.length >= 2 
    ? Number((validHours[validHours.length - 1] - validHours[0]).toFixed(2)) 
    : 0;

  const lastRow = rows[rows.length - 1];
  const deltaT = (lastRow && typeof lastRow.chillerInlet === "number" && typeof lastRow.chillerOutlet === "number")
    ? Number((lastRow.chillerInlet - lastRow.chillerOutlet).toFixed(2))
    : 0;

  return { deltaT, totalEnergyConsumed, totalRunHours };
};