import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import type { ChillingEntry } from "../../types/chillingCompressor";

interface Props {
  row: ChillingEntry;
  isNewRow?: boolean;
  onChange: (id: string, field: keyof ChillingEntry, value: any) => void;
  onRemove: (id: string) => void;
  onSaveEdit?: (id: string, updatedData: Partial<ChillingEntry>) => Promise<void>;
}

export const ChillingRowInput: React.FC<Props> = ({
  row,
  isNewRow = false,
  onChange,
  onRemove,
  onSaveEdit
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<ChillingEntry>({ ...row });
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = user?.role === "admin";
  const canEditDirectly = isNewRow || (isAdmin && isEditing);

  const parseNum = (val: string): number | "" => (val === "" ? "" : Number(val));

  const handleEditClick = () => {
    setEditValues({ ...row });
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleSaveClick = async () => {
    if (!onSaveEdit) return;
    setIsSaving(true);
    try {
      await onSaveEdit(row.id, editValues);
      setIsEditing(false);
    } catch {
      alert("Chilling entry edit fail zala!");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof ChillingEntry, value: any) => {
    if (isEditing) {
      setEditValues(prev => ({ ...prev, [field]: value }));
    } else {
      onChange(row.id, field, value);
    }
  };

  const currentData = isEditing ? editValues : row;

  return (
    <tr className={`border-b text-xs ${isEditing ? "bg-amber-50/60" : "hover:bg-slate-50"}`}>
      {/* Time */}
      <td className="p-1 border">
        {canEditDirectly ? (
          <input
            type="time"
            value={currentData.time}
            onChange={e => updateField("time", e.target.value)}
            className="w-16 border p-0.5 rounded text-xs"
          />
        ) : (
          <span className="font-mono text-slate-700">{row.time || "--:--"}</span>
        )}
      </td>

      {/* Amp */}
      <td className="p-1 border">
        {canEditDirectly ? (
          <input
            type="number"
            value={currentData.currentAmp}
            onChange={e => updateField("currentAmp", parseNum(e.target.value))}
            className="w-12 border p-0.5 rounded text-xs"
          />
        ) : (
          <span className="font-semibold text-slate-700">{row.currentAmp !== "" ? row.currentAmp : "--"}</span>
        )}
      </td>

      {/* SP */}
      <td className="p-1 border">
        {canEditDirectly ? (
          <input
            type="number"
            step="0.1"
            value={currentData.spPressure}
            onChange={e => updateField("spPressure", parseNum(e.target.value))}
            className="w-12 border p-0.5 rounded text-xs"
          />
        ) : (
          <span>{row.spPressure !== "" ? row.spPressure : "--"}</span>
        )}
      </td>

      {/* OP */}
      <td className="p-1 border">
        {canEditDirectly ? (
          <input
            type="number"
            step="0.1"
            value={currentData.opPressure}
            onChange={e => updateField("opPressure", parseNum(e.target.value))}
            className="w-12 border p-0.5 rounded text-xs"
          />
        ) : (
          <span>{row.opPressure !== "" ? row.opPressure : "--"}</span>
        )}
      </td>

      {/* DP */}
      <td className="p-1 border">
        {canEditDirectly ? (
          <input
            type="number"
            step="0.1"
            value={currentData.dpPressure}
            onChange={e => updateField("dpPressure", parseNum(e.target.value))}
            className="w-12 border p-0.5 rounded text-xs"
          />
        ) : (
          <span>{row.dpPressure !== "" ? row.dpPressure : "--"}</span>
        )}
      </td>

      {/* Disch °C */}
      <td className="p-1 border">
        {canEditDirectly ? (
          <input
            type="number"
            step="0.1"
            value={currentData.dischTemp}
            onChange={e => updateField("dischTemp", parseNum(e.target.value))}
            className="w-12 border p-0.5 rounded text-xs"
          />
        ) : (
          <span>{row.dischTemp !== "" ? row.dischTemp : "--"}</span>
        )}
      </td>

      {/* Oil °C */}
      <td className="p-1 border">
        {canEditDirectly ? (
          <input
            type="number"
            step="0.1"
            value={currentData.oilTemp}
            onChange={e => updateField("oilTemp", parseNum(e.target.value))}
            className="w-12 border p-0.5 rounded text-xs"
          />
        ) : (
          <span>{row.oilTemp !== "" ? row.oilTemp : "--"}</span>
        )}
      </td>

      {/* Cond In */}
      <td className="p-1 border">
        {canEditDirectly ? (
          <input
            type="number"
            step="0.1"
            value={currentData.condenserInlet}
            onChange={e => updateField("condenserInlet", parseNum(e.target.value))}
            className="w-12 border p-0.5 rounded text-xs"
          />
        ) : (
          <span>{row.condenserInlet !== "" ? row.condenserInlet : "--"}</span>
        )}
      </td>

      {/* Cond Out */}
      <td className="p-1 border">
        {canEditDirectly ? (
          <input
            type="number"
            step="0.1"
            value={currentData.condenserOutlet}
            onChange={e => updateField("condenserOutlet", parseNum(e.target.value))}
            className="w-12 border p-0.5 rounded text-xs"
          />
        ) : (
          <span>{row.condenserOutlet !== "" ? row.condenserOutlet : "--"}</span>
        )}
      </td>

      {/* Chil In */}
      <td className="p-1 border">
        {canEditDirectly ? (
          <input
            type="number"
            step="0.1"
            value={currentData.chillerInlet}
            onChange={e => updateField("chillerInlet", parseNum(e.target.value))}
            className="w-12 border p-0.5 rounded text-xs"
          />
        ) : (
          <span>{row.chillerInlet !== "" ? row.chillerInlet : "--"}</span>
        )}
      </td>

      {/* Chil Out */}
      <td className="p-1 border">
        {canEditDirectly ? (
          <input
            type="number"
            step="0.1"
            value={currentData.chillerOutlet}
            onChange={e => updateField("chillerOutlet", parseNum(e.target.value))}
            className="w-12 border p-0.5 rounded text-xs"
          />
        ) : (
          <span>{row.chillerOutlet !== "" ? row.chillerOutlet : "--"}</span>
        )}
      </td>

      {/* Brine °C */}
      <td className="p-1 border">
        {canEditDirectly ? (
          <input
            type="number"
            step="0.1"
            value={currentData.brineTankTemp}
            onChange={e => updateField("brineTankTemp", parseNum(e.target.value))}
            className="w-12 border p-0.5 rounded text-xs"
          />
        ) : (
          <span>{row.brineTankTemp !== "" ? row.brineTankTemp : "--"}</span>
        )}
      </td>

      {/* Level */}
      <td className="p-1 border">
        {canEditDirectly ? (
          <input
            type="number"
            value={currentData.brineLevel}
            onChange={e => updateField("brineLevel", parseNum(e.target.value))}
            className="w-12 border p-0.5 rounded text-xs"
          />
        ) : (
          <span>{row.brineLevel !== "" ? row.brineLevel : "--"}</span>
        )}
      </td>

      {/* Hours */}
      <td className="p-1 border">
        {canEditDirectly ? (
          <input
            type="number"
            value={currentData.runHours}
            onChange={e => updateField("runHours", parseNum(e.target.value))}
            className="w-14 border p-0.5 rounded text-xs"
          />
        ) : (
          <span>{row.runHours !== "" ? row.runHours : "--"}</span>
        )}
      </td>

      {/* KWH */}
      <td className="p-1 border">
        {canEditDirectly ? (
          <input
            type="number"
            value={currentData.kwh}
            onChange={e => updateField("kwh", parseNum(e.target.value))}
            className="w-14 border p-0.5 rounded text-xs"
          />
        ) : (
          <span>{row.kwh !== "" ? row.kwh : "--"}</span>
        )}
      </td>

      {/* Reactor */}
      <td className="p-1 border">
        {canEditDirectly ? (
          <input
            type="text"
            value={currentData.loadingReactor}
            onChange={e => updateField("loadingReactor", e.target.value)}
            className="w-12 border p-0.5 rounded text-xs"
          />
        ) : (
          <span className="font-semibold text-slate-700">{row.loadingReactor || "--"}</span>
        )}
      </td>

      {/* Sign */}
      <td className="p-1 border">
        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
          {row.operatorSign || "Oper"}
        </span>
      </td>

      {/* Admin Actions */}
      {isAdmin && (
        <td className="p-1 border text-center whitespace-nowrap">
          {isNewRow ? (
            <button
              onClick={() => onRemove(row.id)}
              className="text-red-500 hover:text-red-700 font-bold px-1.5"
              title="Remove row"
            >
              ✕
            </button>
          ) : isEditing ? (
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={handleSaveClick}
                disabled={isSaving}
                className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700"
              >
                {isSaving ? "..." : "Save"}
              </button>
              <button
                onClick={handleCancelClick}
                className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold hover:bg-slate-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={handleEditClick}
                className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded text-[10px] font-bold hover:bg-indigo-100"
              >
                Edit
              </button>
              <button
                onClick={() => onRemove(row.id)}
                className="px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded text-[10px] font-bold hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          )}
        </td>
      )}
    </tr>
  );
};