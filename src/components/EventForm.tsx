"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SlotPicker, type SlotField } from "@/components/SlotPicker";
import {
  isPastDeadline,
  jstDateTimeStringToDate,
} from "@/lib/datetime";
import { createEventSchema, type SlotType } from "@/lib/schemas";

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

export function EventForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slotType, setSlotType] = useState<SlotType>("date");
  const [slots, setSlots] = useState<SlotField[]>([]);
  const [deadline, setDeadline] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      title,
      description: description.trim() === "" ? null : description,
      deadline: deadline.trim() === "" ? null : deadline,
      slots: slots
        .filter((slot) => slot.startAt.trim() !== "")
        .map((slot) => ({
        type: slotType,
        startAt: slot.startAt,
      })),
    }),
    [deadline, description, slotType, slots, title],
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (deadlineWarning) {
      setErrorMessage(deadlineWarning);
      return;
    }

    const validated = createEventSchema.safeParse(payload);
    if (!validated.success) {
      setErrorMessage(validated.error.issues[0]?.message ?? "入力内容を確認してください");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setErrorMessage(data?.error ?? "予定の作成に失敗しました");
        return;
      }

      const data = (await response.json()) as {
        eventId: string;
        hostToken: string;
      };

      router.push(`/e/${data.eventId}/created?token=${data.hostToken}`);
    } catch {
      setErrorMessage("通信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-zinc-800">
          タイトル <span className="text-red-600">*</span>
        </label>
        <input
          id="title"
          type="text"
          required
          maxLength={100}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          placeholder="例: 7月キックオフ打ち合わせ"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="text-sm font-medium text-zinc-800"
        >
          説明（任意）
        </label>
        <textarea
          id="description"
          maxLength={2000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          placeholder="場所・目的・補足など"
        />
      </div>

      <SlotPicker
        slotType={slotType}
        slots={slots}
        onSlotTypeChange={handleSlotTypeChange}
        onSlotsChange={setSlots}
      />

      <div className="space-y-2">
        <label htmlFor="deadline" className="text-sm font-medium text-zinc-800">
          回答期限（任意）
        </label>
        <input
          id="deadline"
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "作成中..." : "予定を作成する"}
      </button>
    </form>
  );
}
