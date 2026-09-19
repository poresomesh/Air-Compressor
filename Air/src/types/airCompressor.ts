export interface AirCompressorEntry {
  id: string;
  time: string;
  oilPressure: number | "";
  airPressure: number | "";
  temperature: number | "";
  airReceiverPressure: number | "";
  operatorSign: string;
}

export interface AirCompressorSummaryData {
  avgTemperature: number;
  avgAirPressure: number;
  maxTemperature: number;
}