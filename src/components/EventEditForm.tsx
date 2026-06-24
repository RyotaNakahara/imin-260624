"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SlotPicker } from "@/components/SlotPicker";
import {
  isPastDeadline,
  jstDateTimeStringToDate,
  toJstDateInput,
  toJstDateTimeLocalInput,
} from "@/lib/datetime";
import { updateEventSchema, type SlotType } from "@/lib/schemas";

type SlotField = {
  id: string;
  dbId?: string;
  startAt: string;
};

type EventEditFormProps = {
  eventId: string;
  hostToken: string;
  initialTitle: string;
  initialDescription: string | null;
  initialDeadline: string | null;
  initialSlots: Array<{
    id: string;
    type: SlotType;
    startAt: string;
  }>;
  slotsWithAnswers: string[];
};

function slotToInputValue(type: SlotType, iso: string): string {
  const date = new Date(iso);
  return type === "date" ? toJstDateInput(date) : toJstDateTimeLocalInput(date);
}

function nextDateTimeValue(value: string, nextType: SlotType): string {
  if (!value) return "";
  if (nextType === "date") {
    return value.split("T")[0] ?? "";
  }
  if (value.includes("T")) {
    return value.slice(0, 16);
  }
  return `${value}T09:00`;
}

function resolveInitialSlotType(
  slots: EventEditFormProps["initialSlots"],
): SlotType {
  return slots[0]?.type ?? "date";
}

export function EventEditForm({
  eventId,
  hostToken,
  initialTitle,
  initialDescription,
  initialDeadline,
  initialSlots,
  slotsWithAnswers,
}: EventEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [slotType, setSlotType] = useState<SlotType>(
    resolveInitialSlotType(initialSlots),
  );
  const [slots, setSlots] = useState<SlotField[]>(
    initialSlots.map((slot) => ({
      id: crypto.randomUUID(),
      dbId: slot.id,
      startAt: slotToInputValue(slot.type, slot.startAt),
    })),
  );
  const [deadline, setDeadline] = useState(
    initialDeadline ? toJstDateTimeLocalInput(new Date(initialDeadline)) : "",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slotsWithAnswersSet = useMemo(
    () => new Set(slotsWithAnswers),
    [slotsWithAnswers],
  );

  const deadlineWarning = useMemo(() => {
    if (!deadline.trim()) return null;
    try {
      const deadlineDate = jstDateTimeStringToDate(deadline);
      if (isPastDeadline(deadlineDate)) {
        return "回答期限が過去の日時です。未来の日時を指定してください。";
      }
    } catch {
      return null;
    }
    return null;
  }, [deadline]);

  const payload = useMemo(
    () => ({
      hostToken,
      title,
      description: description.trim() === "" ? null : description,
      deadline: deadline.trim() === "" ? null : deadline,
      slots: slots.map((slot) => ({
        ...(slot.dbId ? { id: slot.dbId } : {}),
        type: slotType,
        startAt: slot.startAt,
      })),
    }),
    [deadline, description, hostToken, slotType, slots, title],
  );

  function handleSlotTypeChange(nextType: SlotType) {
    setSlotType(nextType);
    setSlots((current) =>
      current.map((slot) => ({
        ...slot,
        startAt: nextDateTimeValue(slot.startAt, nextType),
      })),
    );
  }

  function handleChangeSlot(id: string, value: string) {
    setSlots((current) =>
      current.map((slot) => (slot.id === id ? { ...slot, startAt: value } : slot)),
    );
  }

  function handleAddSlot() {
    if (slots.length >= 30) return;
    setSlots((current) => [
      ...current,
      { id: crypto.randomUUID(), startAt: "" },
    ]);
  }

  function handleRemoveSlot(id: string) {
    const target = slots.find((slot) => slot.id === id);
    if (!target) return;

    if (target.dbId && slotsWithAnswersSet.has(target.dbId)) {
      const confirmed = window.confirm(
        "この候補日には回答があります。削除すると関連する回答も削除されます。よろしいですか？",
      );
      if (!confirmed) return;
    }

    setSlots((current) =>
      current.length === 1 ? current : current.filter((slot) => slot.id !== id),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (deadlineWarning) {
      setErrorMessage(deadlineWarning);
      return;
    }

    const validated = updateEventSchema.safeParse(payload);
    if (!validated.success) {
      setErrorMessage(
        validated.error.issues[0]?.message ?? "入力内容を確認してください",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setErrorMessage(data?.error ?? "予定の更新に失敗しました");
        return;
      }

      setSuccessMessage("予定を更新しました");
      router.refresh();
    } catch {
      setErrorMessage("通信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-zinc-900">予定を編集</h2>

      <div className="space-y-2">
        <label htmlFor="edit-title" className="text-sm font-medium text-zinc-800">
          タイトル <span className="text-red-600">*</span>
        </label>
        <input
          id="edit-title"
          type="text"
          required
          maxLength={100}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="edit-description"
          className="text-sm font-medium text-zinc-800"
        >
          説明（任意）
        </label>
        <textarea
          id="edit-description"
          maxLength={2000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <SlotPicker
        slotType={slotType}
        slots={slots}
        onSlotTypeChange={handleSlotTypeChange}
        onChangeSlot={handleChangeSlot}
        onAddSlot={handleAddSlot}
        onRemoveSlot={handleRemoveSlot}
      />

      <div className="space-y-2">
        <label
          htmlFor="edit-deadline"
          className="text-sm font-medium text-zinc-800"
        >
          回答期限（任意）
        </label>
        <input
          id="edit-deadline"
          type="datetime-local"
          value={deadline}
          onChange={(event) => setDeadline(event.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <p className="text-xs text-zinc-500">日時は JST で扱われます。</p>
        {deadlineWarning ? (
          <p className="text-xs text-amber-700">{deadlineWarning}</p>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "更新中..." : "変更を保存"}
      </button>
    </form>
  );
}
