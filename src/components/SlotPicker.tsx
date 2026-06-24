"use client";

import type { SlotType } from "@/lib/schemas";

type SlotField = {
  id: string;
  startAt: string;
};

type SlotPickerProps = {
  slotType: SlotType;
  slots: SlotField[];
  maxSlots?: number;
  onSlotTypeChange: (slotType: SlotType) => void;
  onChangeSlot: (id: string, value: string) => void;
  onAddSlot: () => void;
  onRemoveSlot: (id: string) => void;
};

export function SlotPicker({
  slotType,
  slots,
  maxSlots = 30,
  onSlotTypeChange,
  onChangeSlot,
  onAddSlot,
  onRemoveSlot,
}: SlotPickerProps) {
  const inputType = slotType === "date" ? "date" : "datetime-local";
  const reachedMax = slots.length >= maxSlots;

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

      <div className="space-y-2">
        {slots.map((slot, index) => (
          <div key={slot.id} className="flex items-center gap-2">
            <input
              type={inputType}
              value={slot.startAt}
              onChange={(event) => onChangeSlot(slot.id, event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => onRemoveSlot(slot.id)}
              disabled={slots.length <= 1}
              className="shrink-0 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`候補 ${index + 1} を削除`}
            >
              削除
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddSlot}
        disabled={reachedMax}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        候補を追加
      </button>
      <p className="text-xs text-zinc-500">
        候補は最大 {maxSlots} 件まで登録できます。
      </p>
    </fieldset>
  );
}
