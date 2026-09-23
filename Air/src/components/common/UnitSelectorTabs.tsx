import React from "react";

interface Props {
  units: { id: string; label: string; icon?: string }[];
  activeUnit: string;
  onSelectUnit: (unitId: string) => void;
  colorScheme?: "indigo" | "cyan";
}

export const UnitSelectorTabs: React.FC<Props> = ({
  units,
  activeUnit,
  onSelectUnit,
  colorScheme = "indigo"
}) => {
  const activeClass =
    colorScheme === "indigo"
      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
      : "bg-cyan-600 text-white shadow-md shadow-cyan-600/20";

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 border border-slate-200/80 rounded-2xl w-fit mb-4">
      {units.map((unit) => {
        const isActive = activeUnit === unit.id;
        return (
          <button
            key={unit.id}
            type="button"
            onClick={() => onSelectUnit(unit.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-tight transition-all active:scale-[0.98] ${
              isActive
                ? activeClass
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <span>{unit.icon || "⚙️"}</span>
            <span>{unit.label}</span>
          </button>
        );
      })}
    </div>
  );
};