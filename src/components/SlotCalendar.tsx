"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ja } from "date-fns/locale";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

type SlotCalendarProps = {
  viewMonth: Date;
  selectedDateKeys: Set<string>;
  onViewMonthChange: (month: Date) => void;
  onToggleDate: (dateKey: string) => void;
};

export function SlotCalendar({
  viewMonth,
  selectedDateKeys,
  onViewMonthChange,
  onToggleDate,
}: SlotCalendarProps) {
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onViewMonthChange(subMonths(viewMonth, 1))}
          className="rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-200"
          aria-label="前の月"
        >
          ‹
        </button>
        <p className="text-sm font-medium text-zinc-800">
          {format(viewMonth, "yyyy年M月", { locale: ja })}
        </p>
        <button
          type="button"
          onClick={() => onViewMonthChange(addMonths(viewMonth, 1))}
          className="rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-200"
          aria-label="次の月"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1 font-medium">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const isSelected = selectedDateKeys.has(dateKey);
          const inMonth = isSameMonth(day, viewMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onToggleDate(dateKey)}
              className={[
                "aspect-square rounded-md text-sm transition-colors",
                inMonth ? "text-zinc-800" : "text-zinc-300",
                isSelected
                  ? "bg-zinc-900 font-medium text-white hover:bg-zinc-700"
                  : "hover:bg-zinc-200",
                isToday && !isSelected ? "ring-1 ring-zinc-400 ring-inset" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={isSelected}
              aria-label={format(day, "yyyy年M月d日", { locale: ja })}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        日付をタップして候補の追加・解除ができます。
      </p>
    </div>
  );
}

export function initialViewMonth(slots: { startAt: string }[], slotType: "date" | "datetime"): Date {
  const firstFilled = slots.find((slot) => slot.startAt.trim() !== "");
  if (firstFilled) {
    const key =
      slotType === "date"
        ? firstFilled.startAt
        : (firstFilled.startAt.split("T")[0] ?? "");
    if (key) return startOfMonth(parseISO(key));
  }
  return startOfMonth(new Date());
}
