"use client";

import { useMemo, useState } from "react";
import {
  generateDateRange,
  mergeDateKeysIntoSlots,
  slotDateKey,
  sortSlotFields,
  toSlotStartAt,
} from "@/lib/slot-dates";
import type { SlotType } from "@/lib/schemas";
import { initialViewMonth, SlotCalendar } from "@/components/SlotCalendar";

export type SlotField = {
  id: string;
  startAt: string;
  dbId?: string;
};

type SlotPickerProps = {
  slotType: SlotType;
  slots: SlotField[];
  maxSlots?: number;
  onSlotTypeChange: (slotType: SlotType) => void;
  onSlotsChange: (slots: SlotField[]) => void;
  onBeforeRemoveSlot?: (slot: SlotField) => boolean;
};

function createSlot(startAt: string): SlotField {
  return { id: crypto.randomUUID(), startAt };
}

function formatSlotLabel(startAt: string, slotType: SlotType): string {
  if (!startAt) return "";
  if (slotType === "date") {
    const [y, m, d] = startAt.split("-");
    return `${y}/${m}/${d}`;
  }
  const [datePart, timePart] = startAt.split("T");
  const [y, m, d] = (datePart ?? "").split("-");
  const [hh, mm] = (timePart ?? "").split(":");
  return `${y}/${m}/${d} ${hh}:${mm}`;
}

export function SlotPicker({
  slotType,
  slots,
  maxSlots = 30,
  onSlotTypeChange,
  onSlotsChange,
  onBeforeRemoveSlot,
}: SlotPickerProps) {
  const [viewMonth, setViewMonth] = useState(() => initialViewMonth(slots, slotType));
  const [defaultTime, setDefaultTime] = useState("09:00");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [weekdaysOnly, setWeekdaysOnly] = useState(false);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);

  const filledSlots = useMemo(
    () => slots.filter((slot) => slot.startAt.trim() !== ""),
    [slots],
  );
  const sortedSlots = useMemo(
    () => sortSlotFields(filledSlots, slotType),
    [filledSlots, slotType],
  );
  const selectedDateKeys = useMemo(
    () =>
      new Set(
        filledSlots
          .map((slot) => slotDateKey(slot.startAt, slotType))
          .filter((key) => key !== ""),
      ),
    [filledSlots, slotType],
  );
  const reachedMax = filledSlots.length >= maxSlots;

  function tryRemoveSlot(slot: SlotField) {
    if (onBeforeRemoveSlot && !onBeforeRemoveSlot(slot)) return;
    const next = slots.filter((item) => item.id !== slot.id);
    onSlotsChange(next);
  }

  function handleToggleDate(dateKey: string) {
    const existing = filledSlots.find(
      (slot) => slotDateKey(slot.startAt, slotType) === dateKey,
    );

    if (existing) {
      tryRemoveSlot(existing);
      return;
    }

    if (reachedMax) return;

    const next = mergeDateKeysIntoSlots(
      filledSlots,
      [dateKey],
      slotType,
      createSlot,
      { defaultTime, maxSlots },
    );
    onSlotsChange(next);
  }

  function handleAddRange() {
    setRangeError(null);
    if (!rangeStart || !rangeEnd) {
      setRangeError("開始日と終了日を入力してください。");
      return;
    }

    const dateKeys = generateDateRange(rangeStart, rangeEnd, { weekdaysOnly });
    if (dateKeys.length === 0) {
      setRangeError("終了日は開始日以降にしてください。");
      return;
    }

    const beforeCount = filledSlots.length;
    const next = mergeDateKeysIntoSlots(
      filledSlots,
      dateKeys,
      slotType,
      createSlot,
      { defaultTime, maxSlots },
    );
    const added = next.length - beforeCount;

    if (added === 0) {
      setRangeError(
        reachedMax
          ? `候補は最大 ${maxSlots} 件までです。`
          : "選択した期間の日付はすべて追加済みです。",
      );
      return;
    }

    onSlotsChange(next);
    if (added < dateKeys.length) {
      setRangeError(
        `一部の日付のみ追加しました（上限 ${maxSlots} 件のため ${added} 件）。`,
      );
    }
  }

  function handleChangeSlot(id: string, value: string) {
    onSlotsChange(
      slots.map((slot) => (slot.id === id ? { ...slot, startAt: value } : slot)),
    );
  }

  function handleRemoveSlot(id: string) {
    const target = slots.find((slot) => slot.id === id);
    if (!target) return;
    tryRemoveSlot(target);
  }

  function handleAddManualSlot() {
    if (reachedMax) return;
    onSlotsChange([...slots, createSlot("")]);
  }

  function handleApplyDefaultTime() {
    if (slotType !== "datetime" || !defaultTime) return;
    onSlotsChange(
      slots.map((slot) => {
        if (!slot.startAt.trim()) return slot;
        const dateKey = slotDateKey(slot.startAt, slotType);
        if (!dateKey) return slot;
        return { ...slot, startAt: toSlotStartAt(dateKey, slotType, defaultTime) };
      }),
    );
  }

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-medium text-zinc-800">候補日</legend>

      <div className="flex gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="slot-type"
            value="date"
            checked={slotType === "date"}
            onChange={() => onSlotTypeChange("date")}
          />
          日付のみ
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="slot-type"
            value="datetime"
            checked={slotType === "datetime"}
            onChange={() => onSlotTypeChange("datetime")}
          />
          日時
        </label>
      </div>

      {slotType === "datetime" ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <label htmlFor="default-time" className="text-xs text-zinc-600">
              新規追加時の時刻
            </label>
            <input
              id="default-time"
              type="time"
              value={defaultTime}
              onChange={(event) => setDefaultTime(event.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleApplyDefaultTime}
            disabled={filledSlots.length === 0}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            全候補に適用
          </button>
        </div>
      ) : null}

      <SlotCalendar
        viewMonth={viewMonth}
        selectedDateKeys={selectedDateKeys}
        onViewMonthChange={setViewMonth}
        onToggleDate={handleToggleDate}
      />

      <div className="rounded-lg border border-zinc-200 p-3 space-y-3">
        <p className="text-sm font-medium text-zinc-800">期間で一括追加</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={rangeStart}
            onChange={(event) => setRangeStart(event.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            aria-label="開始日"
          />
          <span className="text-sm text-zinc-500">〜</span>
          <input
            type="date"
            value={rangeEnd}
            onChange={(event) => setRangeEnd(event.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            aria-label="終了日"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={weekdaysOnly}
            onChange={(event) => setWeekdaysOnly(event.target.checked)}
          />
          平日のみ（月〜金）
        </label>
        <button
          type="button"
          onClick={handleAddRange}
          disabled={reachedMax}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          期間を追加
        </button>
        {rangeError ? (
          <p className="text-xs text-amber-700">{rangeError}</p>
        ) : null}
      </div>

      {sortedSlots.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-800">
              選択中（{sortedSlots.length} 件）
            </p>
            {reachedMax ? (
              <p className="text-xs text-amber-700">上限 {maxSlots} 件に達しました</p>
            ) : null}
          </div>
          <ul className="flex flex-wrap gap-2">
            {sortedSlots.map((slot) => (
              <li key={slot.id}>
                <button
                  type="button"
                  onClick={() => tryRemoveSlot(slot)}
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-800 hover:bg-zinc-100"
                  aria-label={`${formatSlotLabel(slot.startAt, slotType)} を削除`}
                >
                  {formatSlotLabel(slot.startAt, slotType)}
                  <span className="text-zinc-400" aria-hidden>
                    ×
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">カレンダーまたは期間指定で候補日を選んでください。</p>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowManualInput((current) => !current)}
          className="text-sm text-zinc-600 underline hover:text-zinc-900"
        >
          {showManualInput ? "個別入力を閉じる" : "個別に入力する"}
        </button>
      </div>

      {showManualInput ? (
        <div className="space-y-2 border-t border-zinc-100 pt-3">
          {(slots.length === 0 ? [createSlot("")] : slots).map((slot, index) => {
            const inputType = slotType === "date" ? "date" : "datetime-local";
            return (
              <div key={slot.id} className="flex items-center gap-2">
                <input
                  type={inputType}
                  value={slot.startAt}
                  onChange={(event) => handleChangeSlot(slot.id, event.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSlot(slot.id)}
                  disabled={filledSlots.length <= 1 && slot.startAt.trim() !== ""}
                  className="shrink-0 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`候補 ${index + 1} を削除`}
                >
                  削除
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={handleAddManualSlot}
            disabled={reachedMax}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            候補を追加
          </button>
        </div>
      ) : null}

      <p className="text-xs text-zinc-500">
        候補は最大 {maxSlots} 件まで登録できます。日時は JST で扱われます。
      </p>
    </fieldset>
  );
}
