import type { ChillingEntry } from "../types/chillingCompressor";

export interface ChillingStats {
  deltaT: number;
  totalKwh: number;
  totalEnergyConsumed: number;
  totalRunHours: number;
}

export const calculateChillingStats = (rows: ChillingEntry[]): ChillingStats => {
  if (!rows || rows.length === 0) {
    return {
      deltaT: 0,
      totalKwh: 0,
      totalEnergyConsumed: 0,
      totalRunHours: 0
    };
  }

  const validRows = rows.filter(r => r.kwh !== "" || r.runHours !== "");
  const latestRow = validRows.length > 0 ? validRows[validRows.length - 1] : rows[rows.length - 1];

  let deltaT = 0;
  if (latestRow?.chillerInlet && latestRow?.chillerOutlet) {
    const inlet = parseFloat(String(latestRow.chillerInlet));
    const outlet = parseFloat(String(latestRow.chillerOutlet));
    if (!isNaN(inlet) && !isNaN(outlet)) {
      deltaT = parseFloat((inlet - outlet).toFixed(1));
    }
  }

  const currentKwh = latestRow?.kwh ? parseFloat(String(latestRow.kwh)) || 0 : 0;
  const currentRunHours = latestRow?.runHours ? parseFloat(String(latestRow.runHours)) || 0 : 0;

  return {
    deltaT,
    totalKwh: currentKwh,
    totalEnergyConsumed: currentKwh,
    totalRunHours: currentRunHours
  };
};