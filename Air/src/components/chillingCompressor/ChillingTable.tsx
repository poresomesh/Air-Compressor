import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import type { ChillingEntry } from "../../types/chillingCompressor";
import { ChillingRowInput } from "./ChillingRowInput";
import { ChillingSummary } from "./ChillingSummary";
import { calculateChillingStats } from "../../utils/chillingCompressorCalculations";
import API from "../../utils/api";

export const ChillingTable: React.FC = () => {
  const { user } = useAuth();
  const defaultShift = user?.role === "admin" ? "A" : (user?.assignedShift || "A");

  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [shift, setShift] = useState<string>(defaultShift);
  const [rows, setRows] = useState<ChillingEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // 1. Fetch Readings from Backend API
  const fetchLogs = async () => {
    setLoading(true);
    setStatusMessage("");
    try {
      const res = await API.get("/plant/logs", {
        params: {
          blockType: "CHILLING_COMPRESSOR",
          date: date
        }
      });

      const logs = res.data.filter((entry: any) => entry.shift === shift);

      const mappedRows: ChillingEntry[] = logs.map((entry: any) => ({
        id: entry._id,
        time: entry.readingTime,
        currentAmp: entry.data?.currentAmp ?? "",
        spPressure: entry.data?.spPressure ?? "",
        opPressure: entry.data?.opPressure ?? "",
        dpPressure: entry.data?.dpPressure ?? "",
        dischTemp: entry.data?.dischTemp ?? "",
        oilTemp: entry.data?.oilTemp ?? "",
        condenserInlet: entry.data?.condenserInlet ?? "",
        condenserOutlet: entry.data?.condenserOutlet ?? "",
        chillerInlet: entry.data?.chillerInlet ?? "",
        chillerOutlet: entry.data?.chillerOutlet ?? "",
        brineTankTemp: entry.data?.brineTankTemp ?? "",
        brineLevel: entry.data?.brineLevel ?? "",
        runHours: entry.data?.runHours ?? "",
        kwh: entry.data?.kwh ?? "",
        specificGravity: entry.data?.specificGravity ?? "",
        loadingReactor: entry.data?.loadingReactor ?? "",
        operatorSign: entry.operatorName || ""
      }));

      setRows(mappedRows);
    } catch (err: any) {
      console.error("Fetch Chilling Logs Error:", err);
      setStatusMessage("Failed to load chilling logs from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [date, shift]);

  const handleRowChange = (id: string, field: keyof ChillingEntry, value: any) => {
    setRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleAddRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        currentAmp: "",
        spPressure: "",
        opPressure: "",
        dpPressure: "",
        dischTemp: "",
        oilTemp: "",
        condenserInlet: "",
        condenserOutlet: "",
        chillerInlet: "",
        chillerOutlet: "",
        brineTankTemp: "",
        brineLevel: "",
        runHours: "",
        kwh: "",
        specificGravity: "",
        loadingReactor: "",
        operatorSign: user?.name || ""
      }
    ]);
  };

  // 2. Delete Entry (Admin Only)
  const handleRemoveRow = async (id: string) => {
    if (user?.role !== "admin") return;

    if (id.startsWith("temp-")) {
      setRows(prev => prev.filter(row => row.id !== id));
      return;
    }

    if (!window.confirm("Kharach hi chilling entry delete karaychi ahe ka?")) return;

    try {
      await API.delete(`/plant/logs/${id}`);
      setRows(prev => prev.filter(row => row.id !== id));
      setStatusMessage("Chilling entry deleted successfully!");
    } catch (err: any) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  // 3. Admin Edit Save (PUT API)
  const handleSaveEdit = async (id: string, updatedData: Partial<ChillingEntry>) => {
    try {
      await API.put(`/plant/logs/${id}`, {
        readingTime: updatedData.time,
        data: {
          currentAmp: updatedData.currentAmp,
          spPressure: updatedData.spPressure,
          opPressure: updatedData.opPressure,
          dpPressure: updatedData.dpPressure,
          dischTemp: updatedData.dischTemp,
          oilTemp: updatedData.oilTemp,
          condenserInlet: updatedData.condenserInlet,
          condenserOutlet: updatedData.condenserOutlet,
          chillerInlet: updatedData.chillerInlet,
          chillerOutlet: updatedData.chillerOutlet,
          brineTankTemp: updatedData.brineTankTemp,
          brineLevel: updatedData.brineLevel,
          runHours: updatedData.runHours,
          kwh: updatedData.kwh,
          specificGravity: updatedData.specificGravity,
          loadingReactor: updatedData.loadingReactor
        }
      });
      setStatusMessage("Chilling entry updated successfully!");
      await fetchLogs();
    } catch (err: any) {
      alert("Update failed: " + (err.response?.data?.message || err.message));
      throw err;
    }
  };

  // 4. Save New Rows to DB
  const handleSaveAll = async () => {
    setSaving(true);
    setStatusMessage("");
    try {
      const newEntries = rows.filter(r => r.id.startsWith("temp-"));

      if (newEntries.length === 0) {
        setStatusMessage("No new chilling readings to save.");
        setSaving(false);
        return;
      }

      for (const entry of newEntries) {
        await API.post("/plant/logs", {
          blockType: "CHILLING_COMPRESSOR",
          shift: user?.role === "admin" ? shift : user?.assignedShift,
          date,
          readingTime: entry.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          data: {
            currentAmp: entry.currentAmp,
            spPressure: entry.spPressure,
            opPressure: entry.opPressure,
            dpPressure: entry.dpPressure,
            dischTemp: entry.dischTemp,
            oilTemp: entry.oilTemp,
            condenserInlet: entry.condenserInlet,
            condenserOutlet: entry.condenserOutlet,
            chillerInlet: entry.chillerInlet,
            chillerOutlet: entry.chillerOutlet,
            brineTankTemp: entry.brineTankTemp,
            brineLevel: entry.brineLevel,
            runHours: entry.runHours,
            kwh: entry.kwh,
            specificGravity: entry.specificGravity,
            loadingReactor: entry.loadingReactor
          }
        });
      }

      setStatusMessage("Chilling readings saved successfully to database!");
      await fetchLogs();
    } catch (err: any) {
      console.error("Save Error:", err);
      setStatusMessage("Error saving chilling data: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const summary = calculateChillingStats(rows);
  const hasUnsavedRows = rows.some(r => r.id.startsWith("temp-"));

  return (
    <div className="p-6 bg-white shadow rounded-lg border border-slate-200 mt-4">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">CHILLING COMPRESSOR READINGS</h2>
          <p className="text-xs text-slate-500">Smruthi Organics Limited - Plant Maintenance Log</p>
        </div>
        {statusMessage && (
          <span className="text-xs font-semibold px-3 py-1 bg-cyan-50 text-cyan-800 rounded border border-cyan-200">
            {statusMessage}
          </span>
        )}
        <div className="flex items-center gap-4">
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            className="border p-1 rounded text-xs bg-white" 
          />
          
          {user?.role === "admin" ? (
            <select 
              value={shift} 
              onChange={e => setShift(e.target.value)} 
              className="border p-1 rounded text-xs bg-white font-semibold"
            >
              <option value="A">Shift A</option>
              <option value="B">Shift B</option>
              <option value="C">Shift C</option>
            </select>
          ) : (
            <div className="flex items-center gap-1">
              <span className="border border-slate-300 bg-slate-100 text-cyan-800 font-bold px-3 py-1 rounded text-xs">
                Shift {user?.assignedShift}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">🔒 (Locked)</span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-xs text-slate-500">Loading chilling readings...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="p-1 border">Time</th>
                <th className="p-1 border">Amp</th>
                <th className="p-1 border">SP</th>
                <th className="p-1 border">OP</th>
                <th className="p-1 border">DP</th>
                <th className="p-1 border">Disch °C</th>
                <th className="p-1 border">Oil °C</th>
                <th className="p-1 border">Cond In</th>
                <th className="p-1 border">Cond Out</th>
                <th className="p-1 border">Chil In</th>
                <th className="p-1 border">Chil Out</th>
                <th className="p-1 border">Brine °C</th>
                <th className="p-1 border">Level</th>
                <th className="p-1 border">Hours</th>
                <th className="p-1 border">KWH</th>
                <th className="p-1 border">Reactor</th>
                <th className="p-1 border">Sign</th>
                {user?.role === "admin" && (
                  <th className="p-1 border text-center">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === "admin" ? 18 : 17} className="text-center p-4 text-slate-400 text-xs">
                    No chilling records found for Date: {date} & Shift: {shift}. Click "+ Add Reading Row" to start.
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <ChillingRowInput
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
          className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded shadow hover:bg-slate-900 transition"
        >
          + Add Reading Row
        </button>

        {hasUnsavedRows && (
          <button 
            onClick={handleSaveAll} 
            disabled={saving}
            className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded shadow hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "💾 Save New Readings to Database"}
          </button>
        )}
      </div>

      <ChillingSummary summary={summary} />
    </div>
  );
};