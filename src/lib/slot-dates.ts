import {
  compareAsc,
  eachDayOfInterval,
  format,
  getDay,
  parseISO,
} from "date-fns";
import type { SlotType } from "@/lib/schemas";

export function slotDateKey(startAt: string, slotType: SlotType): string {
  if (!startAt) return "";
  return slotType === "date" ? startAt : (startAt.split("T")[0] ?? "");
}

export function toSlotStartAt(
  dateKey: string,
  slotType: SlotType,
  defaultTime = "09:00",
): string {
  return slotType === "date" ? dateKey : `${dateKey}T${defaultTime}`;
}

export function sortSlotFields<T extends { startAt: string }>(
  slots: T[],
  slotType: SlotType,
): T[] {
  return [...slots].sort((a, b) => {
    const aKey = slotDateKey(a.startAt, slotType);
    const bKey = slotDateKey(b.startAt, slotType);
    if (!aKey && !bKey) return 0;
    if (!aKey) return 1;
    if (!bKey) return -1;
    if (slotType === "datetime") {
      return a.startAt.localeCompare(b.startAt);
    }
    return compareAsc(parseISO(aKey), parseISO(bKey));
  });
}

export function generateDateRange(
  startDate: string,
  endDate: string,
  options?: { weekdaysOnly?: boolean },
): string[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  if (compareAsc(start, end) > 0) return [];

  const dates = eachDayOfInterval({ start, end });
  const filtered = options?.weekdaysOnly
    ? dates.filter((date) => {
        const day = getDay(date);
        return day >= 1 && day <= 5;
      })
    : dates;

  return filtered.map((date) => format(date, "yyyy-MM-dd"));
}

export function mergeDateKeysIntoSlots<T extends { id: string; startAt: string }>(
  existing: T[],
  dateKeys: string[],
  slotType: SlotType,
  createSlot: (startAt: string) => T,
  options?: { defaultTime?: string; maxSlots?: number },
): T[] {
  const maxSlots = options?.maxSlots ?? 30;
  const defaultTime = options?.defaultTime ?? "09:00";
  const existingKeys = new Set(
    existing
      .map((slot) => slotDateKey(slot.startAt, slotType))
      .filter((key) => key !== ""),
  );

  const filled = existing.filter((slot) => slot.startAt.trim() !== "");
  const remaining = maxSlots - filled.length;
  if (remaining <= 0) return sortSlotFields(filled, slotType);

  const toAdd = dateKeys
    .filter((key) => !existingKeys.has(key))
    .slice(0, remaining)
    .map((key) => createSlot(toSlotStartAt(key, slotType, defaultTime)));

  return sortSlotFields([...filled, ...toAdd], slotType);
}
