import type { ChillingEntry } from "../types/chillingCompressor";

export interface ChillingStats {
  deltaT: string;
  totalKwh: string;
  totalRunHours: string;
}

export const calculateChillingStats = (rows: ChillingEntry[]): ChillingStats => {
  if (!rows || rows.length === 0) {
    return {
      deltaT: "0",
      totalKwh: "0",
      totalRunHours: "0"
    };
  }

  // शेवटची (सध्याची/करंट) रो शोधणे जिथे डेटा भरला आहे
  const validRows = rows.filter(r => r.kwh !== "" || r.runHours !== "");
  const latestRow = validRows.length > 0 ? validRows[validRows.length - 1] : rows[rows.length - 1];

  // 1. Chiller Delta T
  let deltaT = "0";
  if (latestRow?.chillerInlet && latestRow?.chillerOutlet) {
    const inlet = parseFloat(String(latestRow.chillerInlet));
    const outlet = parseFloat(String(latestRow.chillerOutlet));
    if (!isNaN(inlet) && !isNaN(outlet)) {
      deltaT = (inlet - outlet).toFixed(1).replace(/\.0$/, "");
    }
  }

  // 2. Current KWH (करंट टाकलेला आकडा जसाच्या तसा)
  const currentKwh = latestRow?.kwh ? String(latestRow.kwh) : "0";

  // 3. Current Run Hours (करंट टाकलेले तास जसेच्या तसे)
  const currentRunHours = latestRow?.runHours ? String(latestRow.runHours) : "0";

  return {
    deltaT,
    totalKwh: currentKwh,
    totalRunHours: currentRunHours
  };
};