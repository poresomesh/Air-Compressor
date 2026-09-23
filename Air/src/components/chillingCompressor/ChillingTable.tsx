import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import type { ChillingEntry } from "../../types/chillingCompressor";
import { ChillingRowInput } from "./ChillingRowInput";
import { ChillingSummary } from "./ChillingSummary";
import { calculateChillingStats } from "../../utils/chillingCompressorCalculations";
import { TimeFilterTabs } from "../common/TimeFilterTabs";
import { UnitSelectorTabs } from "../common/UnitSelectorTabs";
import { isDateInPeriod, TimeFilterPeriod } from "../../utils/dateFilters";
import API from "../../utils/api";

interface ExtendedChillingEntry extends ChillingEntry {
  date?: string;
  shift?: string;
}

const CHILLING_UNITS = [
  { id: "CHILLING_COMPRESSOR_A", label: "Chilling Unit A", icon: "❄️" },
  { id: "CHILLING_COMPRESSOR_B", label: "Chilling Unit B", icon: "🧊" },
];

export const ChillingTable: React.FC = () => {
  const { user } = useAuth();
  const defaultShift = user?.role === "admin" ? "A" : (user?.assignedShift || "A");

  const [activeUnit, setActiveUnit] = useState<string>("CHILLING_COMPRESSOR_A");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [shift, setShift] = useState<string>(defaultShift);
  const [activePeriod, setActivePeriod] = useState<TimeFilterPeriod>("today");
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [rows, setRows] = useState<ExtendedChillingEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // 1. Fetch Readings with Safe Fallback
  const fetchLogs = async (unit: string = activeUnit) => {
    setLoading(true);
    setStatusMessage("");
    try {
      const res = await API.get("/plant/logs", {
        params: {
          blockType: unit
        }
      });
      if (Array.isArray(res.data)) {
        setAllLogs(res.data);
      } else {
        setAllLogs([]);
      }
    } catch (err: any) {
      console.error("Fetch Chilling Logs Error:", err);
      setAllLogs([]);
      setStatusMessage("Failed to load chilling logs from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(activeUnit);
  }, [activeUnit]);

  // 2. Safe Row Filtering
  useEffect(() => {
    if (!Array.isArray(allLogs)) {
      setRows([]);
      return;
    }

    const filtered = allLogs.filter((entry: any) => {
      const matchesShift = user?.role === "admin" ? entry.shift === shift : true;
      if (activePeriod === "today") {
        return matchesShift && entry.date === date;
      }
      return matchesShift && isDateInPeriod(entry.date, activePeriod);
    });

    const mappedRows: ExtendedChillingEntry[] = filtered.map((entry: any) => ({
      id: entry._id,
      date: entry.date,
      shift: entry.shift,
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
  }, [allLogs, shift, activePeriod, date, user?.role]);

  // 3. Live Counts Safe Guard
  const periodCounts = useMemo(() => {
    if (!Array.isArray(allLogs)) {
      return { today: 0, week: 0, month: 0, year: 0 };
    }

    const shiftFiltered = allLogs.filter((entry: any) => 
      user?.role === "admin" ? entry.shift === shift : true
    );

    return {
      today: shiftFiltered.filter((r) => isDateInPeriod(r.date, "today")).length,
      week: shiftFiltered.filter((r) => isDateInPeriod(r.date, "week")).length,
      month: shiftFiltered.filter((r) => isDateInPeriod(r.date, "month")).length,
      year: shiftFiltered.filter((r) => isDateInPeriod(r.date, "year")).length,
    };
  }, [allLogs, shift, user?.role]);

  const handleRowChange = (id: string, field: keyof ChillingEntry, value: any) => {
    setRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleAddRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        date: date,
        shift: user?.role === "admin" ? shift : user?.assignedShift,
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
      setAllLogs(prev => prev.filter((r: any) => r._id !== id));
      setStatusMessage("Chilling entry deleted successfully!");
    } catch (err: any) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

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
      await fetchLogs(activeUnit);
    } catch (err: any) {
      alert("Update failed: " + (err.response?.data?.message || err.message));
      throw err;
    }
  };

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
          blockType: activeUnit,
          shift: user?.role === "admin" ? shift : user?.assignedShift,
          date: entry.date || date,
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
      await fetchLogs(activeUnit);
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
    <div className="space-y-4">
      {/* 2 CHILLING COMPRESSOR TABS: A, B */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <UnitSelectorTabs
          units={CHILLING_UNITS}
          activeUnit={activeUnit}
          onSelectUnit={setActiveUnit}
          colorScheme="cyan"
        />
        <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          Active Station: <strong className="text-cyan-700">{CHILLING_UNITS.find(u => u.id === activeUnit)?.label}</strong>
        </span>
      </div>

      <div className="p-6 bg-white shadow-sm rounded-2xl border border-slate-200/80">
        <div className="flex flex-wrap justify-between items-center mb-5 gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">
              {CHILLING_UNITS.find(u => u.id === activeUnit)?.label?.toUpperCase()} READINGS
            </h2>
            <p className="text-xs text-slate-500">Smruthi Organics Limited - Plant Maintenance Log</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <TimeFilterTabs
              activePeriod={activePeriod}
              onPeriodChange={setActivePeriod}
              counts={periodCounts}
            />
            {statusMessage && (
              <span className="text-xs font-semibold px-3 py-1 bg-cyan-50 text-cyan-800 rounded-lg border border-cyan-200">
                {statusMessage}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Log Date:</span>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs bg-white font-semibold focus:outline-none focus:border-indigo-500" 
              />
            </div>

            {user?.role === "admin" ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Shift:</span>
                <select 
                  value={shift} 
                  onChange={e => setShift(e.target.value)} 
                  className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs bg-white font-bold text-indigo-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="A">Shift A</option>
                  <option value="B">Shift B</option>
                  <option value="C">Shift C</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="border border-indigo-100 bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-xl text-xs">
                  Shift {user?.assignedShift}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">🔒 (Locked)</span>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs text-slate-500 font-medium">
            Loading {CHILLING_UNITS.find(u => u.id === activeUnit)?.label}...
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-black uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <th className="p-2 border-r">Time</th>
                  <th className="p-2 border-r">Amp</th>
                  <th className="p-2 border-r">SP</th>
                  <th className="p-2 border-r">OP</th>
                  <th className="p-2 border-r">DP</th>
                  <th className="p-2 border-r">Disch °C</th>
                  <th className="p-2 border-r">Oil °C</th>
                  <th className="p-2 border-r">Cond In</th>
                  <th className="p-2 border-r">Cond Out</th>
                  <th className="p-2 border-r">Chil In</th>
                  <th className="p-2 border-r">Chil Out</th>
                  <th className="p-2 border-r">Brine °C</th>
                  <th className="p-2 border-r">Level</th>
                  <th className="p-2 border-r">Hours</th>
                  <th className="p-2 border-r">KWH</th>
                  <th className="p-2 border-r">Reactor</th>
                  <th className="p-2 border-r">Sign</th>
                  {user?.role === "admin" && (
                    <th className="p-2 text-center">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={user?.role === "admin" ? 18 : 17}
                      className="text-center py-8 text-slate-400 text-xs"
                    >
                      No chilling records found for {CHILLING_UNITS.find(u => u.id === activeUnit)?.label} (Period: <span className="font-bold capitalize">{activePeriod}</span>, Shift {shift}).
                      {activePeriod === "today" && ' Click "+ Add Reading Row" to start.'}
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

        {activePeriod === "today" && (
          <div className="flex items-center gap-3 mt-4">
            <button 
              onClick={handleAddRow} 
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              + Add Reading Row
            </button>

            {hasUnsavedRows && (
              <button 
                onClick={handleSaveAll} 
                disabled={saving}
                className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "💾 Save New Readings to Database"}
              </button>
            )}
          </div>
        )}

        <ChillingSummary summary={summary} />
      </div>
    </div>
  );
};