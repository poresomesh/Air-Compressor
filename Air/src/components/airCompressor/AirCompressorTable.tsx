import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import type { AirCompressorEntry } from "../../types/airCompressor";
import { AirCompressorHeader } from "./AirCompressorHeader";
import { AirCompressorRowInput } from "./AirCompressorRowInput";
import { AirCompressorSummary } from "./AirCompressorSummary";
import { calculateAirCompressorStats } from "../../utils/airCompressorCalculations";
import API from "../../utils/api";

export const AirCompressorTable: React.FC = () => {
  const { user } = useAuth();
  const defaultShift = user?.role === "admin" ? "A" : (user?.assignedShift || "A");

  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [shift, setShift] = useState<string>(defaultShift);
  const [rows, setRows] = useState<AirCompressorEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const fetchLogs = async () => {
    setLoading(true);
    setStatusMessage("");
    try {
      const res = await API.get("/plant/logs", {
        params: {
          blockType: "AIR_COMPRESSOR",
          date: date
        }
      });

      const logs = res.data.filter((entry: any) => entry.shift === shift);
      
      const mappedRows: AirCompressorEntry[] = logs.map((entry: any) => ({
        id: entry._id,
        time: entry.readingTime,
        oilPressure: entry.data?.oilPressure ?? "",
        airPressure: entry.data?.airPressure ?? "",
        temperature: entry.data?.temperature ?? "",
        airReceiverPressure: entry.data?.airReceiverPressure ?? "",
        operatorSign: entry.operatorName || ""
      }));

      setRows(mappedRows);
    } catch (err: any) {
      console.error("Fetch Logs Error:", err);
      setStatusMessage("Failed to load logs from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [date, shift]);

  const handleRowChange = (id: string, field: keyof AirCompressorEntry, value: any) => {
    setRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleAddRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        oilPressure: "",
        airPressure: "",
        temperature: "",
        airReceiverPressure: "",
        operatorSign: user?.name || ""
      }
    ]);
  };

  // Delete Row
  const handleRemoveRow = async (id: string) => {
    if (user?.role !== "admin") return;

    if (id.startsWith("temp-")) {
      setRows(prev => prev.filter(row => row.id !== id));
      return;
    }

    if (!window.confirm("Kharach hi entry delete karaychi ahe ka?")) return;

    try {
      await API.delete(`/plant/logs/${id}`);
      setRows(prev => prev.filter(row => row.id !== id));
      setStatusMessage("Entry deleted successfully!");
    } catch (err: any) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  // Admin Edit Save Handler (PUT API)
  const handleSaveEdit = async (id: string, updatedData: Partial<AirCompressorEntry>) => {
    try {
      await API.put(`/plant/logs/${id}`, {
        readingTime: updatedData.time,
        data: {
          oilPressure: updatedData.oilPressure,
          airPressure: updatedData.airPressure,
          temperature: updatedData.temperature,
          airReceiverPressure: updatedData.airReceiverPressure
        }
      });
      setStatusMessage("Entry successfully updated by Admin!");
      await fetchLogs();
    } catch (err: any) {
      alert("Update failed: " + (err.response?.data?.message || err.message));
      throw err;
    }
  };

  // Save New Rows to DB
  const handleSaveAll = async () => {
    setSaving(true);
    setStatusMessage("");
    try {
      const newEntries = rows.filter(r => r.id.startsWith("temp-"));

      if (newEntries.length === 0) {
        setStatusMessage("Navin entries nahit save karnyasaathi.");
        setSaving(false);
        return;
      }

      for (const entry of newEntries) {
        await API.post("/plant/logs", {
          blockType: "AIR_COMPRESSOR",
          shift: user?.role === "admin" ? shift : user?.assignedShift,
          date,
          readingTime: entry.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          data: {
            oilPressure: entry.oilPressure,
            airPressure: entry.airPressure,
            temperature: entry.temperature,
            airReceiverPressure: entry.airReceiverPressure
          }
        });
      }

      setStatusMessage("Readings saved successfully to database!");
      await fetchLogs();
    } catch (err: any) {
      console.error("Save Error:", err);
      setStatusMessage("Error saving data: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const summary = calculateAirCompressorStats(rows);
  const hasUnsavedRows = rows.some(r => r.id.startsWith("temp-"));

  return (
    <div className="p-6 bg-white shadow rounded-lg border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">OPERATING RECORDS OF AIR COMPRESSOR</h2>
          <p className="text-xs text-slate-500">Smruthi Organics Limited - Plant Maintenance Log</p>
        </div>
        {statusMessage && (
          <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
            {statusMessage}
          </span>
        )}
      </div>
      
      <AirCompressorHeader date={date} setDate={setDate} shift={shift} setShift={setShift} />
      
      {loading ? (
        <div className="text-center py-8 text-xs text-slate-500">Loading readings from database...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="p-2 border">Time</th>
                <th className="p-2 border">Oil Press (Kg/cm²)</th>
                <th className="p-2 border">Air Press (Kg/cm²)</th>
                <th className="p-2 border">Temp (°C)</th>
                <th className="p-2 border">Air Rec. Press (Kg/cm²)</th>
                <th className="p-2 border">Sign</th>
                {user?.role === "admin" && (
                  <th className="p-2 border text-center">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === "admin" ? 7 : 6} className="text-center p-4 text-slate-400 text-xs">
                    No readings found for Date: {date} & Shift: {shift}. Click "+ Add Reading Row" to start.
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <AirCompressorRowInput 
                    key={row.id} 
                    row={row} 
                    isNewRow={row.id.startsWith("temp-")}
                    onChange={handleRowChange} 
                    onRemove={handleRemoveRow} 
                    onSaveEdit={handleSaveEdit}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-3 mt-4">
        <button 
          onClick={handleAddRow} 
          className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-md shadow hover:bg-slate-900 transition"
        >
          + Add Reading Row
        </button>

        {hasUnsavedRows && (
          <button 
            onClick={handleSaveAll} 
            disabled={saving}
            className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-md shadow hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "💾 Save New Readings to Database"}
          </button>
        )}
      </div>

      <AirCompressorSummary summary={summary} />
    </div>
  );
};