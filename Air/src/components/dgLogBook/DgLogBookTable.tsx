import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { UnitSelectorTabs } from "../common/UnitSelectorTabs";
import { TimeFilterTabs } from "../common/TimeFilterTabs";
import { isDateInPeriod, TimeFilterPeriod } from "../../utils/dateFilters";
import API from "../../utils/api";

const DG_UNITS = [
  { id: "DG_350_KVA", label: "DG 350 KVA", icon: "⚡" },
  { id: "DG_500_KVA", label: "DG 500 KVA", icon: "⚡" }
];

interface DgEntry {
  id: string;
  date?: string;
  shift?: string;
  time: string;
  waterTemp: string;
  lubeOilTemp: string;
  lubeOilPressure: string;
  rpm: string;
  freqHz: string;
  volts: string;
  amps: string;
  fuelTank: string;
  fuelCharged: string;
  fuelCons: string;
  kwh: string;
  sfc: string;
  hm: string;
  totalRunHrs: string;
  remark: string;
  operatorSign: string;
}

// 1. DG LOG ROW COMPONENT (Air Compressor Style Styling)
const DgLogRow: React.FC<{
  row: DgEntry;
  isNewRow: boolean;
  isAdmin: boolean;
  onChange: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
  onSaveEdit: (id: string, data: Partial<DgEntry>) => Promise<void>;
}> = ({ row, isNewRow, isAdmin, onChange, onRemove, onSaveEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<DgEntry>({ ...row });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setEditData({ ...row });
  }, [row]);

  const handleEditChange = (field: string, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setUpdating(true);
    try {
      await onSaveEdit(row.id, editData);
      setIsEditing(false);
    } catch {
      // error handled in parent
    } finally {
      setUpdating(false);
    }
  };

  // Editable Row (New Row kiva Edit mode)
  if (isNewRow || isEditing) {
    const currentData = isNewRow ? row : editData;
    const handleChange = isNewRow
      ? (field: string, val: string) => onChange(row.id, field, val)
      : handleEditChange;

    return (
      <tr className={isNewRow ? "bg-amber-50/40" : "bg-indigo-50/30"}>
        <td className="p-2 border-r border-slate-200 text-center">
          <input
            type="text"
            value={currentData.time}
            onChange={(e) => handleChange("time", e.target.value)}
            className="w-16 p-1 border border-slate-300 rounded text-center text-xs font-semibold focus:outline-none focus:border-indigo-500 bg-white"
          />
        </td>
        <td className="p-2 border-r border-slate-200 text-center">
          <input
            type="text"
            value={currentData.waterTemp}
            onChange={(e) => handleChange("waterTemp", e.target.value)}
            className="w-16 p-1 border border-slate-300 rounded text-center text-xs focus:outline-none focus:border-indigo-500 bg-white"
          />
        </td>
        <td className="p-2 border-r border-slate-200 text-center">
          <input
            type="text"
            value={currentData.lubeOilTemp}
            onChange={(e) => handleChange("lubeOilTemp", e.target.value)}
            className="w-16 p-1 border border-slate-300 rounded text-center text-xs focus:outline-none focus:border-indigo-500 bg-white"
          />
        </td>
        <td className="p-2 border-r border-slate-200 text-center">
          <input
            type="text"
            value={currentData.lubeOilPressure}
            onChange={(e) => handleChange("lubeOilPressure", e.target.value)}
            className="w-16 p-1 border border-slate-300 rounded text-center text-xs focus:outline-none focus:border-indigo-500 bg-white"
          />
        </td>
        <td className="p-2 border-r border-slate-200 text-center">
          <input
            type="text"
            value={currentData.rpm}
            onChange={(e) => handleChange("rpm", e.target.value)}
            className="w-16 p-1 border border-slate-300 rounded text-center text-xs focus:outline-none focus:border-indigo-500 bg-white"
          />
        </td>
        <td className="p-2 border-r border-slate-200 text-center">
          <input
            type="text"
            value={currentData.freqHz}
            onChange={(e) => handleChange("freqHz", e.target.value)}
            className="w-16 p-1 border border-slate-300 rounded text-center text-xs focus:outline-none focus:border-indigo-500 bg-white"
          />
        </td>
        <td className="p-2 border-r border-slate-200 text-center">
          <input
            type="text"
            value={currentData.volts}
            onChange={(e) => handleChange("volts", e.target.value)}
            className="w-16 p-1 border border-slate-300 rounded text-center text-xs focus:outline-none focus:border-indigo-500 bg-white"
          />
        </td>
        <td className="p-2 border-r border-slate-200 text-center">
          <input
            type="text"
            value={currentData.amps}
            onChange={(e) => handleChange("amps", e.target.value)}
            className="w-16 p-1 border border-slate-300 rounded text-center text-xs focus:outline-none focus:border-indigo-500 bg-white"
          />
        </td>
        <td className="p-2 border-r border-slate-200 text-center">
          <input
            type="text"
            value={currentData.fuelTank}
            onChange={(e) => handleChange("fuelTank", e.target.value)}
            className="w-16 p-1 border border-slate-300 rounded text-center text-xs focus:outline-none focus:border-indigo-500 bg-white"
          />
        </td>
        <td className="p-2 border-r border-slate-200 text-center">
          <input
            type="text"
            value={currentData.fuelCons}
            onChange={(e) => handleChange("fuelCons", e.target.value)}
            className="w-16 p-1 border border-slate-300 rounded text-center text-xs focus:outline-none focus:border-indigo-500 bg-white"
          />
        </td>
        <td className="p-2 border-r border-slate-200 text-center">
          <input
            type="text"
            value={currentData.kwh}
            onChange={(e) => handleChange("kwh", e.target.value)}
            className="w-16 p-1 border border-slate-300 rounded text-center text-xs focus:outline-none focus:border-indigo-500 bg-white"
          />
        </td>
        <td className="p-2 border-r border-slate-200 text-center">
          <input
            type="text"
            value={currentData.sfc}
            onChange={(e) => handleChange("sfc", e.target.value)}
            className="w-16 p-1 border border-slate-300 rounded text-center text-xs focus:outline-none focus:border-indigo-500 bg-white"
          />
        </td>
        <td className="p-2 border-r border-slate-200 text-center">
          <input
            type="text"
            value={currentData.totalRunHrs}
            onChange={(e) => handleChange("totalRunHrs", e.target.value)}
            className="w-20 p-1 border border-slate-300 rounded text-center text-xs focus:outline-none focus:border-indigo-500 bg-white"
          />
        </td>
        <td className="p-2 border-r border-slate-200">
          <input
            type="text"
            value={currentData.remark}
            onChange={(e) => handleChange("remark", e.target.value)}
            className="w-28 p-1 border border-slate-300 rounded text-xs focus:outline-none focus:border-indigo-500 bg-white"
          />
        </td>
        <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-700">
          {currentData.operatorSign}
        </td>
        {isAdmin && (
          <td className="p-2 text-center">
            {isNewRow ? (
              <button
                onClick={() => onRemove(row.id)}
                title="Cancel Row"
                className="text-rose-500 hover:text-rose-700 font-bold px-2 py-1"
              >
                ✕
              </button>
            ) : (
              <div className="flex items-center justify-center gap-1.5">
                <button
                  onClick={handleSave}
                  disabled={updating}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                >
                  {updating ? "..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({ ...row });
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </td>
        )}
      </tr>
    );
  }

  // Saved Clean Row (Exact Air Compressor Design)
  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="p-3 border-r border-slate-200 text-center font-mono font-bold text-slate-800">{row.time}</td>
      <td className="p-3 border-r border-slate-200 text-center font-medium text-slate-700">{row.waterTemp || "-"}</td>
      <td className="p-3 border-r border-slate-200 text-center font-medium text-slate-700">{row.lubeOilTemp || "-"}</td>
      <td className="p-3 border-r border-slate-200 text-center font-medium text-slate-700">{row.lubeOilPressure || "-"}</td>
      <td className="p-3 border-r border-slate-200 text-center font-medium text-slate-700">{row.rpm || "-"}</td>
      <td className="p-3 border-r border-slate-200 text-center font-medium text-slate-700">{row.freqHz || "-"}</td>
      <td className="p-3 border-r border-slate-200 text-center font-medium text-slate-700">{row.volts || "-"}</td>
      <td className="p-3 border-r border-slate-200 text-center font-medium text-slate-700">{row.amps || "-"}</td>
      <td className="p-3 border-r border-slate-200 text-center font-medium text-slate-700">{row.fuelTank || "-"}</td>
      <td className="p-3 border-r border-slate-200 text-center font-medium text-slate-700">{row.fuelCons || "-"}</td>
      <td className="p-3 border-r border-slate-200 text-center font-medium text-slate-700">{row.kwh || "-"}</td>
      <td className="p-3 border-r border-slate-200 text-center font-medium text-slate-700">{row.sfc || "-"}</td>
      <td className="p-3 border-r border-slate-200 text-center font-medium text-slate-700">{row.totalRunHrs || "-"}</td>
      <td className="p-3 border-r border-slate-200 text-slate-700 font-medium">{row.remark || "-"}</td>
      <td className="p-3 border-r border-slate-200 text-center font-bold text-slate-800">
        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 text-xs">
          {row.operatorSign || "Operator"}
        </span>
      </td>
      {isAdmin && (
        <td className="p-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg font-bold text-xs transition shadow-2xs"
            >
              Edit
            </button>
            <button
              onClick={() => onRemove(row.id)}
              className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg font-bold text-xs transition shadow-2xs"
            >
              Delete
            </button>
          </div>
        </td>
      )}
    </tr>
  );
};

// 2. MAIN DG LOG BOOK TABLE
export const DgLogBookTable: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [activeUnit, setActiveUnit] = useState<string>("DG_350_KVA");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [shift, setShift] = useState<string>(isAdmin ? "A" : (user?.assignedShift || "A"));
  const [activePeriod, setActivePeriod] = useState<TimeFilterPeriod>("today");
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [rows, setRows] = useState<DgEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>("");

  const fetchLogs = async (unit: string = activeUnit) => {
    setLoading(true);
    setStatusMsg("");
    try {
      const res = await API.get("/plant/logs", { params: { blockType: unit } });
      setAllLogs(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAllLogs([]);
      setStatusMsg("Failed to load DG logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(activeUnit);
  }, [activeUnit]);

  useEffect(() => {
    if (!Array.isArray(allLogs)) {
      setRows([]);
      return;
    }
    const filtered = allLogs.filter((e: any) => {
      const matchShift = isAdmin ? e.shift === shift : true;
      return activePeriod === "today"
        ? matchShift && e.date === date
        : matchShift && isDateInPeriod(e.date, activePeriod);
    });

    setRows(
      filtered.map((e: any) => ({
        id: e._id,
        date: e.date,
        shift: e.shift,
        time: e.readingTime,
        waterTemp: e.data?.waterTemp ?? "",
        lubeOilTemp: e.data?.lubeOilTemp ?? "",
        lubeOilPressure: e.data?.lubeOilPressure ?? "",
        rpm: e.data?.rpm ?? "",
        freqHz: e.data?.freqHz ?? "",
        volts: e.data?.volts ?? "",
        amps: e.data?.amps ?? "",
        fuelTank: e.data?.fuelTank ?? "",
        fuelCharged: e.data?.fuelCharged ?? "",
        fuelCons: e.data?.fuelCons ?? "",
        kwh: e.data?.kwh ?? "",
        sfc: e.data?.sfc ?? "",
        hm: e.data?.hm ?? "",
        totalRunHrs: e.data?.totalRunHrs ?? "",
        remark: e.data?.remark ?? "",
        operatorSign: e.operatorName || ""
      }))
    );
  }, [allLogs, shift, activePeriod, date, isAdmin]);

  const periodCounts = useMemo(() => {
    if (!Array.isArray(allLogs)) return { today: 0, week: 0, month: 0, year: 0 };
    const shiftFiltered = allLogs.filter((e: any) => (isAdmin ? e.shift === shift : true));
    return {
      today: shiftFiltered.filter((r) => isDateInPeriod(r.date, "today")).length,
      week: shiftFiltered.filter((r) => isDateInPeriod(r.date, "week")).length,
      month: shiftFiltered.filter((r) => isDateInPeriod(r.date, "month")).length,
      year: shiftFiltered.filter((r) => isDateInPeriod(r.date, "year")).length
    };
  }, [allLogs, shift, isAdmin]);

  // Calculations for Summary Cards (Air Compressor pramane)
  const summaryStats = useMemo(() => {
    const validRows = rows.filter((r) => !r.id.startsWith("temp-"));
    if (validRows.length === 0) {
      return { avgWaterTemp: "0", avgKwh: "0", maxWaterTemp: "0" };
    }
    const temps = validRows.map((r) => parseFloat(r.waterTemp)).filter((n) => !isNaN(n));
    const kwhs = validRows.map((r) => parseFloat(r.kwh)).filter((n) => !isNaN(n));

    const avgWaterTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : "0";
    const maxWaterTemp = temps.length ? Math.max(...temps).toString() : "0";
    const avgKwh = kwhs.length ? (kwhs.reduce((a, b) => a + b, 0) / kwhs.length).toFixed(1) : "0";

    return { avgWaterTemp, avgKwh, maxWaterTemp };
  }, [rows]);

  const handleRowChange = (id: string, field: string, value: any) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        date,
        shift: isAdmin ? shift : user?.assignedShift,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        waterTemp: "",
        lubeOilTemp: "",
        lubeOilPressure: "",
        rpm: "",
        freqHz: "",
        volts: "",
        amps: "",
        fuelTank: "",
        fuelCharged: "",
        fuelCons: "",
        kwh: "",
        sfc: "",
        hm: "",
        totalRunHrs: "",
        remark: "",
        operatorSign: user?.name || ""
      }
    ]);
  };

  const handleRemoveRow = async (id: string) => {
    if (id.startsWith("temp-")) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      return;
    }
    if (!isAdmin) return;

    if (!window.confirm("Kharekhar hi DG reading entry delete karaychi ahe ka?")) return;

    try {
      await API.delete(`/plant/logs/${id}`);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setAllLogs((prev) => prev.filter((r) => r._id !== id));
      setStatusMsg("Entry successfully deleted!");
    } catch (err: any) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSaveEdit = async (id: string, updatedData: Partial<DgEntry>) => {
    try {
      await API.put(`/plant/logs/${id}`, {
        readingTime: updatedData.time,
        data: {
          waterTemp: updatedData.waterTemp,
          lubeOilTemp: updatedData.lubeOilTemp,
          lubeOilPressure: updatedData.lubeOilPressure,
          rpm: updatedData.rpm,
          freqHz: updatedData.freqHz,
          volts: updatedData.volts,
          amps: updatedData.amps,
          fuelTank: updatedData.fuelTank,
          fuelCharged: updatedData.fuelCharged,
          fuelCons: updatedData.fuelCons,
          kwh: updatedData.kwh,
          sfc: updatedData.sfc,
          hm: updatedData.hm,
          totalRunHrs: updatedData.totalRunHrs,
          remark: updatedData.remark
        }
      });
      setStatusMsg("Entry updated successfully!");
      await fetchLogs(activeUnit);
    } catch (err: any) {
      alert("Update failed: " + (err.response?.data?.message || err.message));
      throw err;
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setStatusMsg("");
    try {
      const newEntries = rows.filter((r) => r.id.startsWith("temp-"));
      if (newEntries.length === 0) {
        setStatusMsg("Navin entries nahit save karnyasaathi.");
        setSaving(false);
        return;
      }

      for (const entry of newEntries) {
        await API.post("/plant/logs", {
          blockType: activeUnit,
          shift: isAdmin ? shift : user?.assignedShift,
          date: entry.date || date,
          readingTime: entry.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          data: {
            waterTemp: entry.waterTemp,
            lubeOilTemp: entry.lubeOilTemp,
            lubeOilPressure: entry.lubeOilPressure,
            rpm: entry.rpm,
            freqHz: entry.freqHz,
            volts: entry.volts,
            amps: entry.amps,
            fuelTank: entry.fuelTank,
            fuelCharged: entry.fuelCharged,
            fuelCons: entry.fuelCons,
            kwh: entry.kwh,
            sfc: entry.sfc,
            hm: entry.hm,
            totalRunHrs: entry.totalRunHrs,
            remark: entry.remark
          }
        });
      }
      setStatusMsg("DG Readings successfully saved!");
      await fetchLogs(activeUnit);
    } catch (err: any) {
      setStatusMsg("Error saving: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedRows = rows.some((r) => r.id.startsWith("temp-"));

  return (
    <div className="space-y-4">
      {/* 1. UNIT SELECTION TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <UnitSelectorTabs
          units={DG_UNITS}
          activeUnit={activeUnit}
          onSelectUnit={setActiveUnit}
          colorScheme="indigo"
        />
        <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          Active Station: <strong className="text-indigo-600">{DG_UNITS.find((u) => u.id === activeUnit)?.label}</strong>
        </span>
      </div>

      {/* 2. MAIN CARD CONTAINER */}
      <div className="p-6 bg-white shadow-xs rounded-2xl border border-slate-200/80">
        <div className="flex flex-wrap justify-between items-center mb-5 gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">
              OPERATING RECORDS OF {DG_UNITS.find((u) => u.id === activeUnit)?.label?.toUpperCase()}
            </h2>
            <p className="text-xs text-slate-500">Smruthi Organics Limited - Plant Maintenance Log</p>
          </div>

          <div className="flex items-center gap-3">
            <TimeFilterTabs activePeriod={activePeriod} onPeriodChange={setActivePeriod} counts={periodCounts} />
            {statusMsg && (
              <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                {statusMsg}
              </span>
            )}
          </div>
        </div>

        {/* 3. DATE & SHIFT CARD (Clean Air Compressor Styling) */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 mb-5 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-white font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Shift:</label>
            {isAdmin ? (
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-white font-bold text-indigo-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="A">Shift A</option>
                <option value="B">Shift B</option>
                <option value="C">Shift C</option>
              </select>
            ) : (
              <span className="border border-indigo-100 bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-xl text-xs">
                Shift {user?.assignedShift}
              </span>
            )}
          </div>
        </div>

        {/* 4. TABLE VIEW */}
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-500 font-medium">
            Loading {DG_UNITS.find((u) => u.id === activeUnit)?.label} records...
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="p-3 border-r border-slate-200 text-center">Time</th>
                  <th className="p-3 border-r border-slate-200 text-center">Water Temp (°C)</th>
                  <th className="p-3 border-r border-slate-200 text-center">Lube Temp</th>
                  <th className="p-3 border-r border-slate-200 text-center">Lube Press (kg/cm²)</th>
                  <th className="p-3 border-r border-slate-200 text-center">RPM</th>
                  <th className="p-3 border-r border-slate-200 text-center">Freq HZ</th>
                  <th className="p-3 border-r border-slate-200 text-center">Volts</th>
                  <th className="p-3 border-r border-slate-200 text-center">Amps</th>
                  <th className="p-3 border-r border-slate-200 text-center">Fuel Tank (Ltr)</th>
                  <th className="p-3 border-r border-slate-200 text-center">Fuel Cons (A)</th>
                  <th className="p-3 border-r border-slate-200 text-center">KWH (B)</th>
                  <th className="p-3 border-r border-slate-200 text-center">SFC (B/A)</th>
                  <th className="p-3 border-r border-slate-200 text-center">Total Run Hrs</th>
                  <th className="p-3 border-r border-slate-200">Remarks</th>
                  <th className="p-3 border-r border-slate-200 text-center">Sign</th>
                  {isAdmin && <th className="p-3 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 16 : 15} className="text-center py-8 text-slate-400">
                      No readings found for {DG_UNITS.find((u) => u.id === activeUnit)?.label} (Period: <span className="font-bold capitalize">{activePeriod}</span>, Shift {shift}).
                      {activePeriod === "today" && ' Click "+ Add Reading Row" to start.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <DgLogRow
                      key={row.id}
                      row={row}
                      isNewRow={row.id.startsWith("temp-")}
                      isAdmin={isAdmin}
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

        {/* 5. ACTION BUTTONS */}
        {activePeriod === "today" && (
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleAddRow}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              + Add Reading Row
            </button>
            {hasUnsavedRows && (
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving..." : "💾 Save New Readings to Database"}
              </button>
            )}
          </div>
        )}

        {/* 6. STATS SUMMARY CARDS (Air Compressor Pramane 3 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100">
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-center">
            <span className="text-[10px] font-black tracking-wider text-blue-600 uppercase">
              Avg Water Temperature
            </span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {summaryStats.avgWaterTemp} <span className="text-sm font-bold text-slate-500">°C</span>
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-center">
            <span className="text-[10px] font-black tracking-wider text-emerald-600 uppercase">
              Avg Power Generation
            </span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {summaryStats.avgKwh} <span className="text-sm font-bold text-slate-500">KWH</span>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-center">
            <span className="text-[10px] font-black tracking-wider text-amber-600 uppercase">
              Max Water Temperature
            </span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {summaryStats.maxWaterTemp} <span className="text-sm font-bold text-slate-500">°C</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};