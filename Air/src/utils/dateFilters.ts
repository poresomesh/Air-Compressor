export type TimeFilterPeriod = "today" | "week" | "month" | "year" | "custom";

export const isDateInPeriod = (
  dateStr: string | undefined | null,
  period: TimeFilterPeriod,
  customDate?: string
): boolean => {
  if (!dateStr) return false;

  // Custom single date filter
  if (period === "custom") {
    if (!customDate) return true;
    return dateStr.startsWith(customDate);
  }

  const targetDate = new Date(dateStr);
  if (isNaN(targetDate.getTime())) return false;

  const now = new Date();

  // Normalize date comparison to local date string YYYY-MM-DD
  const formatYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const todayStr = formatYMD(now);
  const targetYMD = formatYMD(targetDate);

  if (period === "today") {
    return targetYMD === todayStr;
  }

  if (period === "week") {
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return targetDate >= startOfWeek && targetDate <= endOfWeek;
  }

  if (period === "month") {
    return (
      targetDate.getFullYear() === now.getFullYear() &&
      targetDate.getMonth() === now.getMonth()
    );
  }

  if (period === "year") {
    return targetDate.getFullYear() === now.getFullYear();
  }

  return true;
};