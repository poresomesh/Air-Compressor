import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import type { AirCompressorEntry } from "../../types/airCompressor";

interface Props {
  row: AirCompressorEntry;
  isNewRow?: boolean;
  onChange: (id: string, field: keyof AirCompressorEntry, value: any) => void;
  onRemove: (id: string) => void;
  onSaveEdit?: (id: string, updatedData: Partial<AirCompressorEntry>) => Promise<void>;
}

export const AirCompressorRowInput: React.FC<Props> = ({
  row,
  isNewRow = false,
  onChange,
  onRemove,
  onSaveEdit
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<AirCompressorEntry>({ ...row });
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = user?.role === "admin";
  const canEditDirectly = isNewRow || (isAdmin && isEditing);

  const parseNum = (val: string): number | "" => {
    return val === "" ? "" : Number(val);
  };

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
      alert("Edit save fail zala!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <tr className={`border-b text-xs ${isEditing ? "bg-amber-50/60" : "hover:bg-slate-50"}`}>
      {/* Time */}
      <td className="p-2 border">
        {canEditDirectly ? (
          <input
            type="time"
            value={isEditing ? editValues.time : row.time}
            onChange={(e) =>
              isEditing
                ? setEditValues({ ...editValues, time: e.target.value })
                : onChange(row.id, "time", e.target.value)
            }
            className="border border-slate-300 rounded px-1.5 py-0.5 text-xs w-20"
          />
        ) : (
          <span className="font-mono text-slate-700">{row.time || "--:--"}</span>
        )}
      </td>

      {/* Oil Pressure */}
      <td className="p-2 border">
        {canEditDirectly ? (
          <input
            type="number"
            step="0.1"
            value={isEditing ? editValues.oilPressure : row.oilPressure}
            onChange={(e) => {
              const val = parseNum(e.target.value);
              if (isEditing) {
                setEditValues({ ...editValues, oilPressure: val });
              } else {
                onChange(row.id, "oilPressure", val);
              }
            }}
            className="border border-slate-300 rounded px-1.5 py-0.5 text-xs w-20"
            placeholder="0.0"
          />
        ) : (
          <span className="text-slate-700 font-semibold">{row.oilPressure !== "" ? row.oilPressure : "--"}</span>
        )}
      </td>

      {/* Air Pressure */}
      <td className="p-2 border">
        {canEditDirectly ? (
          <input
            type="number"
            step="0.1"
            value={isEditing ? editValues.airPressure : row.airPressure}
            onChange={(e) => {
              const val = parseNum(e.target.value);
              if (isEditing) {
                setEditValues({ ...editValues, airPressure: val });
              } else {
                onChange(row.id, "airPressure", val);
              }
            }}
            className="border border-slate-300 rounded px-1.5 py-0.5 text-xs w-20"
            placeholder="0.0"
          />
        ) : (
          <span className="text-slate-700 font-semibold">{row.airPressure !== "" ? row.airPressure : "--"}</span>
        )}
      </td>

      {/* Temperature */}
      <td className="p-2 border">
        {canEditDirectly ? (
          <input
            type="number"
            value={isEditing ? editValues.temperature : row.temperature}
            onChange={(e) => {
              const val = parseNum(e.target.value);
              if (isEditing) {
                setEditValues({ ...editValues, temperature: val });
              } else {
                onChange(row.id, "temperature", val);
              }
            }}
            className="border border-slate-300 rounded px-1.5 py-0.5 text-xs w-20"
            placeholder="°C"
          />
        ) : (
          <span className="text-slate-700 font-semibold">{row.temperature !== "" ? `${row.temperature} °C` : "--"}</span>
        )}
      </td>

      {/* Air Receiver Pressure */}
      <td className="p-2 border">
        {canEditDirectly ? (
          <input
            type="number"
            step="0.1"
            value={isEditing ? editValues.airReceiverPressure : row.airReceiverPressure}
            onChange={(e) => {
              const val = parseNum(e.target.value);
              if (isEditing) {
                setEditValues({ ...editValues, airReceiverPressure: val });
              } else {
                onChange(row.id, "airReceiverPressure", val);
              }
            }}
            className="border border-slate-300 rounded px-1.5 py-0.5 text-xs w-20"
            placeholder="0.0"
          />
        ) : (
          <span className="text-slate-700 font-semibold">{row.airReceiverPressure !== "" ? row.airReceiverPressure : "--"}</span>
        )}
      </td>

      {/* Sign */}
      <td className="p-2 border">
        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
          {row.operatorSign || "Operator"}
        </span>
      </td>

      {/* Actions (Admin Only) */}
      {isAdmin && (
        <td className="p-2 border text-center whitespace-nowrap">
          {isNewRow ? (
            <button
              onClick={() => onRemove(row.id)}
              className="text-red-500 hover:text-red-700 font-bold px-2 py-0.5"
              title="Remove row"
            >
              ✕
            </button>
          ) : isEditing ? (
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={handleSaveClick}
                disabled={isSaving}
                className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[11px] font-bold hover:bg-emerald-700 transition"
              >
                {isSaving ? "..." : "Save"}
              </button>
              <button
                onClick={handleCancelClick}
                className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px] font-bold hover:bg-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5">
              <button
                onClick={handleEditClick}
                className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded text-[11px] font-bold hover:bg-indigo-100 transition"
              >
                Edit
              </button>
              <button
                onClick={() => onRemove(row.id)}
                className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded text-[11px] font-bold hover:bg-red-100 transition"
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