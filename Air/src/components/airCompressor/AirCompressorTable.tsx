import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import type { AirCompressorEntry } from "../../types/airCompressor";
import { AirCompressorHeader } from "./AirCompressorHeader";
import { AirCompressorRowInput } from "./AirCompressorRowInput";
import { AirCompressorSummary } from "./AirCompressorSummary";
import { calculateAirCompressorStats } from "../../utils/airCompressorCalculations";
import { TimeFilterTabs } from "../common/TimeFilterTabs";
import { UnitSelectorTabs } from "../common/UnitSelectorTabs";
import { isDateInPeriod, TimeFilterPeriod } from "../../utils/dateFilters";
import API from "../../utils/api";

interface ExtendedAirCompressorEntry extends AirCompressorEntry {
  date?: string;
  shift?: string;
}

const AIR_UNITS = [
  { id: "AIR_COMPRESSOR_A", label: "Compressor Unit A", icon: "🅰️" },
  { id: "AIR_COMPRESSOR_B", label: "Compressor Unit B", icon: "🅱️" },
  { id: "AIR_COMPRESSOR_C", label: "Compressor Unit C", icon: "🅲" },
  { id: "AIR_COMPRESSOR_D", label: "Compressor Unit D", icon: "🅳" },
];

export const AirCompressorTable: React.FC = () => {
  const { user } = useAuth();
  const defaultShift = user?.role === "admin" ? "A" : (user?.assignedShift || "A");

  const [activeUnit, setActiveUnit] = useState<string>("AIR_COMPRESSOR_A");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [shift, setShift] = useState<string>(defaultShift);
  const [activePeriod, setActivePeriod] = useState<TimeFilterPeriod>("today");
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [rows, setRows] = useState<ExtendedAirCompressorEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // 1. Fetch Readings with Safe Array Guard
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
      console.error("Fetch Air Compressor Logs Error:", err);
      setAllLogs([]);
      setStatusMessage("Failed to load logs from server.");
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

    const mappedRows: ExtendedAirCompressorEntry[] = filtered.map((entry: any) => ({
      id: entry._id,
      date: entry.date,
      shift: entry.shift,
      time: entry.readingTime,
      oilPressure: entry.data?.oilPressure ?? "",
      airPressure: entry.data?.airPressure ?? "",
      temperature: entry.data?.temperature ?? "",
      airReceiverPressure: entry.data?.airReceiverPressure ?? "",
      operatorSign: entry.operatorName || ""
    }));

    setRows(mappedRows);
  }, [allLogs, shift, activePeriod, date, user?.role]);

  // 3. Live Counts Guard
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

  const handleRowChange = (id: string, field: keyof AirCompressorEntry, value: any) => {
    setRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleAddRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        date: date,
        shift: user?.role === "admin" ? shift : user?.assignedShift,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        oilPressure: "",
        airPressure: "",
        temperature: "",
        airReceiverPressure: "",
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

    if (!window.confirm("Kharach hi entry delete karaychi ahe ka?")) return;

    try {
      await API.delete(`/plant/logs/${id}`);
      setRows(prev => prev.filter(row => row.id !== id));
      setAllLogs(prev => prev.filter((r: any) => r._id !== id));
      setStatusMessage("Entry deleted successfully!");
    } catch (err: any) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

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
        setStatusMessage("Navin entries nahit save karnyasaathi.");
        setSaving(false);
        return;
      }

      for (const entry of newEntries) {
        await API.post("/plant/logs", {
          blockType: activeUnit,
          shift: user?.role === "admin" ? shift : user?.assignedShift,
          date: entry.date || date,
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
      await fetchLogs(activeUnit);
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
    <div className="space-y-4">
      {/* 4 AIR COMPRESSOR TABS: A, B, C, D */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <UnitSelectorTabs
          units={AIR_UNITS}
          activeUnit={activeUnit}
          onSelectUnit={setActiveUnit}
          colorScheme="indigo"
        />
        <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          Active Station: <strong className="text-indigo-600">{AIR_UNITS.find(u => u.id === activeUnit)?.label}</strong>
        </span>
      </div>

      <div className="p-6 bg-white shadow-sm rounded-2xl border border-slate-200/80">
        <div className="flex flex-wrap justify-between items-center mb-5 gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">
              OPERATING RECORDS OF {AIR_UNITS.find(u => u.id === activeUnit)?.label?.toUpperCase()}
            </h2>
            <p className="text-xs text-slate-500">Smruthi Organics Limited - Plant Maintenance Log</p>
          </div>

          <div className="flex items-center gap-3">
            <TimeFilterTabs
              activePeriod={activePeriod}
              onPeriodChange={setActivePeriod}
              counts={periodCounts}
            />
            {statusMessage && (
              <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                {statusMessage}
              </span>
            )}
          </div>
        </div>

        <AirCompressorHeader date={date} setDate={setDate} shift={shift} setShift={setShift} />

        {loading ? (
          <div className="text-center py-10 text-xs text-slate-500 font-medium">
            Loading readings for {AIR_UNITS.find(u => u.id === activeUnit)?.label}...
          </div>
        ) : (
          <div className="overflow-x-auto mt-4 rounded-xl border border-slate-200/80">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-black uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <th className="p-3 border-r">Time</th>
                  <th className="p-3 border-r">Oil Press (Kg/cm²)</th>
                  <th className="p-3 border-r">Air Press (Kg/cm²)</th>
                  <th className="p-3 border-r">Temp (°C)</th>
                  <th className="p-3 border-r">Air Rec. Press (Kg/cm²)</th>
                  <th className="p-3 border-r">Sign</th>
                  {user?.role === "admin" && (
                    <th className="p-3 text-center">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={user?.role === "admin" ? 7 : 6}
                      className="text-center py-8 text-slate-400 text-xs"
                    >
                      No readings found for {AIR_UNITS.find(u => u.id === activeUnit)?.label} (Period: <span className="font-bold capitalize">{activePeriod}</span>, Shift {shift}).
                      {activePeriod === "today" && ' Click "+ Add Reading Row" to start.'}
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

        <AirCompressorSummary summary={summary} />
      </div>
    </div>
  );
};