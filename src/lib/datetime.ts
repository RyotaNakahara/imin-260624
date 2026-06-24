import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const JST_TIMEZONE = "Asia/Tokyo";

/** "2026-06-24" (date input) → UTC Date at JST midnight */
export function jstDateStringToDate(dateStr: string): Date {
  return fromZonedTime(`${dateStr}T00:00:00`, JST_TIMEZONE);
}

/** "2026-06-24T14:00" (datetime-local input) → UTC Date */
export function jstDateTimeStringToDate(dateTimeStr: string): Date {
  const normalized =
    dateTimeStr.length === 16 ? `${dateTimeStr}:00` : dateTimeStr;
  return fromZonedTime(normalized, JST_TIMEZONE);
}

export function formatJstDate(date: Date): string {
  return formatInTimeZone(date, JST_TIMEZONE, "yyyy/MM/dd");
}

export function formatJstDateTime(date: Date): string {
  return formatInTimeZone(date, JST_TIMEZONE, "yyyy/MM/dd HH:mm");
}

export function formatSlotStartAt(
  date: Date,
  type: "date" | "datetime",
): string {
  return type === "date" ? formatJstDate(date) : formatJstDateTime(date);
}

export function isPastDeadline(deadline: Date | null): boolean {
  if (!deadline) return false;
  return Date.now() > deadline.getTime();
}

export function validateFutureDeadline(deadline: Date | null): string | null {
  if (!deadline) return null;
  if (isPastDeadline(deadline)) {
    return "回答期限は未来の日時を指定してください";
  }
  return null;
}

export function toJstDateInput(date: Date): string {
  return formatInTimeZone(date, JST_TIMEZONE, "yyyy-MM-dd");
}

export function toJstDateTimeLocalInput(date: Date): string {
  return formatInTimeZone(date, JST_TIMEZONE, "yyyy-MM-dd'T'HH:mm");
}
