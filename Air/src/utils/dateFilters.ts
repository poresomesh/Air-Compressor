export type TimeFilterPeriod = "today" | "week" | "month" | "year";

export const isDateInPeriod = (dateStr: string, period: TimeFilterPeriod): boolean => {
  if (!dateStr) return false;

  const targetDate = new Date(dateStr);
  const now = new Date();

  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();

  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const nowDay = now.getDate();

  if (period === "today") {
    return targetYear === nowYear && targetMonth === nowMonth && targetDay === nowDay;
  }

  if (period === "week") {
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const checkTime = new Date(targetDate).setHours(12, 0, 0, 0);
    return checkTime >= startOfWeek.getTime() && checkTime <= endOfWeek.getTime();
  }

  if (period === "month") {
    return targetYear === nowYear && targetMonth === nowMonth;
  }

  if (period === "year") {
    return targetYear === nowYear;
  }

  return true;
};