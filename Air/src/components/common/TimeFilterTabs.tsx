import React from "react";
import { TimeFilterPeriod } from "../../utils/dateFilters";

interface Props {
  activePeriod: TimeFilterPeriod;
  onPeriodChange: (period: TimeFilterPeriod) => void;
  counts?: { today?: number; week?: number; month?: number; year?: number };
}

export const TimeFilterTabs: React.FC<Props> = ({
  activePeriod,
  onPeriodChange,
  counts,
}) => {
  const tabs: { id: TimeFilterPeriod; label: string; icon: string }[] = [
    { id: "today", label: "Today", icon: "📅" },
    { id: "week", label: "This Week", icon: "🗓️" },
    { id: "month", label: "This Month", icon: "📊" },
    { id: "year", label: "This Year", icon: "📈" },
  ];

  return (
    <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl shadow-inner">
      {tabs.map((tab) => {
        const isActive = activePeriod === tab.id;
        const count = counts ? counts[tab.id] : undefined;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onPeriodChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isActive
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {count !== undefined && (
              <span
                className={`ml-0.5 text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};