import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { TimeFilterTabs } from "../common/TimeFilterTabs";
import { isDateInPeriod, TimeFilterPeriod } from "../../utils/dateFilters";
import API from "../../utils/api";

interface PowerFailureEntry {
  id: string;
  srNo: number;
  date: string;
  shift: string;
  dgId: string;
  capacity: string;
  startedAt: string;
  stoppedAt: string;
  totalRunHrs: string;
  remarks: string;
  sign: string;
}

export const PowerFailureTable: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [activePeriod, setActivePeriod] = useState<TimeFilterPeriod>("today");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [shiftFilter, setShiftFilter] = useState<string>("ALL"); // Default All Shifts for Admin
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [rows, setRows] = useState<PowerFailureEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<PowerFailureEntry>>({});

  const fetchLogs = async () => {
    setLoading(true);
    setStatusMsg("");
    try {
      const res = await API.get("/plant/logs", { params: { blockType: "POWER_FAILURE" } });
      setAllLogs(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAllLogs([]);
      setStatusMsg("Failed to load power failure records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter based on Period, Date, and Shift
  useEffect(() => {
    if (!Array.isArray(allLogs)) {
      setRows([]);
      return;
    }

    const filtered = allLogs.filter((e: any) => {
      // Shift filter
      const matchShift =
        !isAdmin
          ? e.shift === user?.assignedShift
          : shiftFilter === "ALL" || e.shift === shiftFilter;

      // Period / Date filter
      const matchDate =
        activePeriod === "today"
          ? e.date === date
          : isDateInPeriod(e.date, activePeriod);

      return matchShift && matchDate;
    });

    setRows(
      filtered.map((e: any, idx: number) => ({
        id: e._id,
        srNo: idx + 1,
        date: e.date,
        shift: e.shift || "A",
        dgId: e.data?.dgId ?? "UIDG/001",
        capacity: e.data?.capacity ?? "125 KVA",
        startedAt: e.data?.startedAt ?? "",
        stoppedAt: e.data?.stoppedAt ?? "",
        totalRunHrs: e.data?.totalRunHrs ?? "",
        remarks: e.data?.remarks ?? "",
        sign: e.operatorName || user?.name || "Plant Admin"
      }))
    );
  }, [allLogs, activePeriod, date, shiftFilter, isAdmin, user?.assignedShift, user?.name]);

  const periodCounts = useMemo(() => {
    if (!Array.isArray(allLogs)) return { today: 0, week: 0, month: 0, year: 0 };
    const shiftFiltered = allLogs.filter((e: any) =>
      !isAdmin ? e.shift === user?.assignedShift : shiftFilter === "ALL" || e.shift === shiftFilter
    );
    return {
      today: shiftFiltered.filter((r) => isDateInPeriod(r.date, "today")).length,
      week: shiftFiltered.filter((r) => isDateInPeriod(r.date, "week")).length,
      month: shiftFiltered.filter((r) => isDateInPeriod(r.date, "month")).length,
      year: shiftFiltered.filter((r) => isDateInPeriod(r.date, "year")).length
    };
  }, [allLogs, shiftFilter, isAdmin, user?.assignedShift]);

  const handleRowChange = (id: string, field: string, value: any) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleAddRow = () => {
    // Determine default shift for new row
    const defaultShift = !isAdmin
      ? user?.assignedShift || "A"
      : shiftFilter === "ALL"
      ? "A"
      : shiftFilter;

    setRows((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        srNo: prev.length + 1,
        date: date,
        shift: defaultShift,
        dgId: "UIDG/001",
        capacity: "125 KVA",
        startedAt: "",
        stoppedAt: "",
        totalRunHrs: "",
        remarks: "MSEB Power Failure",
        sign: user?.name || "Plant Admin"
      }
    ]);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setStatusMsg("");
    try {
      const newEntries = rows.filter((r) => r.id.startsWith("temp-"));
      if (newEntries.length === 0) {
        setStatusMsg("No new entries to save.");
        setSaving(false);
        return;
      }

      for (const entry of newEntries) {
        await API.post("/plant/logs", {
          blockType: "POWER_FAILURE",
          shift: entry.shift || "A",
          date: entry.date || date,
          readingTime: entry.startedAt || "00:00",
          data: {
            dgId: entry.dgId || "UIDG/001",
            capacity: entry.capacity || "125 KVA",
            startedAt: entry.startedAt || "",
            stoppedAt: entry.stoppedAt || "",
            totalRunHrs: entry.totalRunHrs || "",
            remarks: entry.remarks || "MSEB Power Failure"
          }
        });
      }
      setStatusMsg("Power failure records saved successfully!");
      await fetchLogs();
    } catch (err: any) {
      console.error("Save Error:", err);
      setStatusMsg("Error saving: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith("temp-")) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      return;
    }
    if (!isAdmin) return;
    if (!window.confirm("Are you sure you want to delete this power failure record?")) return;

    try {
      await API.delete(`/plant/logs/${id}`);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setAllLogs((prev) => prev.filter((r) => r._id !== id));
      setStatusMsg("Record deleted successfully!");
    } catch (err: any) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  const startEdit = (row: PowerFailureEntry) => {
    setEditingId(row.id);
    setEditFormData({ ...row });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await API.put(`/plant/logs/${id}`, {
        shift: editFormData.shift,
        readingTime: editFormData.startedAt || "00:00",
        data: {
          dgId: editFormData.dgId,
          capacity: editFormData.capacity,
          startedAt: editFormData.startedAt,
          stoppedAt: editFormData.stoppedAt,
          totalRunHrs: editFormData.totalRunHrs,
          remarks: editFormData.remarks
        }
      });
      setEditingId(null);
      setStatusMsg("Record updated successfully!");
      await fetchLogs();
    } catch (err: any) {
      alert("Update failed: " + (err.response?.data?.message || err.message));
    }
  };

  const hasUnsavedRows = rows.some((r) => r.id.startsWith("temp-"));

  return (
    <div className="p-6 bg-white shadow-xs rounded-2xl border border-slate-200/80 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight">RECORD OF POWER FAILURE</h2>
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

      {/* Date & Shift Selector Bar (Same as Air Compressor & DG) */}
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
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-white font-bold text-indigo-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Shifts (Master)</option>
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

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-xs text-slate-500">Loading power failure records...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="p-3 border-r border-slate-200 text-center">Sr. No.</th>
                <th className="p-3 border-r border-slate-200 text-center">Date</th>
                <th className="p-3 border-r border-slate-200 text-center">Shift</th>
                <th className="p-3 border-r border-slate-200 text-center">ID No. of DG Set</th>
                <th className="p-3 border-r border-slate-200 text-center">Capacity</th>
                <th className="p-3 border-r border-slate-200 text-center">DG Set Started At</th>
                <th className="p-3 border-r border-slate-200 text-center">DG Set Stopped At</th>
                <th className="p-3 border-r border-slate-200 text-center">Total Running Hrs of DG</th>
                <th className="p-3 border-r border-slate-200">Remarks</th>
                <th className="p-3 border-r border-slate-200 text-center">Sign</th>
                {isAdmin && <th className="p-3 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 11 : 10} className="text-center py-8 text-slate-400">
                    No power failure records found for this selection. Click "+ Add Power Failure Row" to start.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isNew = row.id.startsWith("temp-");
                  const isEditingThis = editingId === row.id;

                  if (isNew || isEditingThis) {
                    const cur = isNew ? row : editFormData;
                    const updateField = (f: string, val: any) =>
                      isNew ? handleRowChange(row.id, f, val) : setEditFormData((prev) => ({ ...prev, [f]: val }));

                    return (
                      <tr key={row.id} className="bg-amber-50/30">
                        <td className="p-2 border-r border-slate-200 text-center font-bold">{row.srNo}</td>
                        <td className="p-2 border-r border-slate-200 text-center">
                          <input
                            type="date"
                            value={cur.date || ""}
                            onChange={(e) => updateField("date", e.target.value)}
                            className="p-1 border border-slate-300 rounded text-xs bg-white"
                          />
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center">
                          <select
                            value={cur.shift || "A"}
                            onChange={(e) => updateField("shift", e.target.value)}
                            className="p-1 border border-slate-300 rounded text-xs font-bold text-indigo-700 bg-white"
                          >
                            <option value="A">Shift A</option>
                            <option value="B">Shift B</option>
                            <option value="C">Shift C</option>
                          </select>
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center">
                          <input
                            type="text"
                            value={cur.dgId || ""}
                            onChange={(e) => updateField("dgId", e.target.value)}
                            className="w-24 p-1 border border-slate-300 rounded text-center text-xs bg-white"
                          />
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center">
                          <input
                            type="text"
                            value={cur.capacity || ""}
                            onChange={(e) => updateField("capacity", e.target.value)}
                            className="w-20 p-1 border border-slate-300 rounded text-center text-xs bg-white"
                          />
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center">
                          <input
                            type="text"
                            placeholder="HH:MM"
                            value={cur.startedAt || ""}
                            onChange={(e) => updateField("startedAt", e.target.value)}
                            className="w-20 p-1 border border-slate-300 rounded text-center font-mono text-xs bg-white"
                          />
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center">
                          <input
                            type="text"
                            placeholder="HH:MM"
                            value={cur.stoppedAt || ""}
                            onChange={(e) => updateField("stoppedAt", e.target.value)}
                            className="w-20 p-1 border border-slate-300 rounded text-center font-mono text-xs bg-white"
                          />
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center">
                          <input
                            type="text"
                            placeholder="e.g. 2 Hrs 50 Mins"
                            value={cur.totalRunHrs || ""}
                            onChange={(e) => updateField("totalRunHrs", e.target.value)}
                            className="w-32 p-1 border border-slate-300 rounded text-center text-xs bg-white"
                          />
                        </td>
                        <td className="p-2 border-r border-slate-200">
                          <input
                            type="text"
                            value={cur.remarks || ""}
                            onChange={(e) => updateField("remarks", e.target.value)}
                            className="w-48 p-1 border border-slate-300 rounded text-xs bg-white"
                          />
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-700">
                          {row.sign}
                        </td>
                        {isAdmin && (
                          <td className="p-2 text-center">
                            {isNew ? (
                              <button
                                onClick={() => handleDelete(row.id)}
                                className="text-rose-500 hover:text-rose-700 font-bold px-2"
                              >
                                ✕
                              </button>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleSaveEdit(row.id)}
                                  className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
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

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 border-r border-slate-200 text-center font-bold text-slate-700">{row.srNo}</td>
                      <td className="p-3 border-r border-slate-200 text-center font-mono font-semibold text-slate-800">{row.date}</td>
                      <td className="p-3 border-r border-slate-200 text-center">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-100">
                          Shift {row.shift}
                        </span>
                      </td>
                      <td className="p-3 border-r border-slate-200 text-center font-semibold text-slate-700">{row.dgId}</td>
                      <td className="p-3 border-r border-slate-200 text-center font-semibold text-slate-700">{row.capacity}</td>
                      <td className="p-3 border-r border-slate-200 text-center font-mono font-bold text-slate-800">{row.startedAt || "-"}</td>
                      <td className="p-3 border-r border-slate-200 text-center font-mono font-bold text-slate-800">{row.stoppedAt || "-"}</td>
                      <td className="p-3 border-r border-slate-200 text-center font-semibold text-slate-800">{row.totalRunHrs || "-"}</td>
                      <td className="p-3 border-r border-slate-200 text-slate-700 font-medium">{row.remarks || "-"}</td>
                      <td className="p-3 border-r border-slate-200 text-center font-bold text-slate-800">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 text-xs">
                          {row.sign}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => startEdit(row)}
                              className="px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg font-bold text-xs transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(row.id)}
                              className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg font-bold text-xs transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleAddRow}
          className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition"
        >
          + Add Power Failure Row
        </button>
        {hasUnsavedRows && (
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "💾 Save Records to Database"}
          </button>
        )}
      </div>
    </div>
  );
};