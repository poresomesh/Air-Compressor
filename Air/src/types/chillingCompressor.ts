export interface ChillingEntry {
  id: string;
  time: string;
  currentAmp: number | "";
  spPressure: number | "";
  opPressure: number | "";
  dpPressure: number | "";
  dischTemp: number | "";
  oilTemp: number | "";
  condenserInlet: number | "";
  condenserOutlet: number | "";
  chillerInlet: number | "";
  chillerOutlet: number | "";
  brineTankTemp: number | "";
  brineLevel: number | "";
  runHours: number | "";
  kwh: number | "";
  specificGravity: number | "";
  loadingReactor: string;
  operatorSign: string;
}

export interface ChillingSummaryData {
  deltaT: number;
  totalEnergyConsumed: number;
  totalRunHours: number;
}