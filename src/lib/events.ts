import type { SlotType } from "@/generated/prisma/enums";
import type { Answer, Event, Response as GuestResponse, Slot } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  formatSlotStartAt,
  isPastDeadline,
  jstDateStringToDate,
  jstDateTimeStringToDate,
} from "@/lib/datetime";
import type { CreateSlotInput } from "@/lib/schemas";

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export function getBaseUrl(request: Request): string {
  const host = request.headers.get("host") ?? "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export function parseSlotStartAt(slot: CreateSlotInput): Date {
  if (slot.type === "date") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(slot.startAt)) {
      throw new Error("日付の形式が正しくありません（YYYY-MM-DD）");
    }
    return jstDateStringToDate(slot.startAt);
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(slot.startAt)) {
    throw new Error("日時の形式が正しくありません（YYYY-MM-DDTHH:mm）");
  }
  return jstDateTimeStringToDate(slot.startAt);
}

export function parseDeadlineInput(
  value: string | null | undefined,
): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return jstDateStringToDate(value);
  }

  const normalized = value.length === 16 ? value : value.slice(0, 19);
  return jstDateTimeStringToDate(normalized);
}

export function serializeSlot(slot: Slot) {
  const type = slot.type as SlotType;
  return {
    id: slot.id,
    type,
    startAt: slot.startAt.toISOString(),
    label: formatSlotStartAt(slot.startAt, type),
    sortOrder: slot.sortOrder,
  };
}

export function serializeEventBase(
  event: Event & { slots: Slot[] },
  options?: { includeHostToken?: boolean },
) {
  const deadlinePassed = isPastDeadline(event.deadline);
  return {
    id: event.id,
    ...(options?.includeHostToken ? { hostToken: event.hostToken } : {}),
    title: event.title,
    description: event.description,
    deadline: event.deadline?.toISOString() ?? null,
    deadlinePassed,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    slots: [...event.slots]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(serializeSlot),
  };
}

export function serializeAnswer(answer: Answer) {
  return {
    slotId: answer.slotId,
    status: answer.status,
  };
}

export function serializeGuestResponse(
  response: GuestResponse & { answers: Answer[] },
) {
  return {
    id: response.id,
    responseToken: response.responseToken,
    displayName: response.displayName,
    createdAt: response.createdAt.toISOString(),
    updatedAt: response.updatedAt.toISOString(),
    answers: response.answers.map(serializeAnswer),
  };
}

export async function findEventOrNull(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    include: {
      slots: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function findEventForManage(eventId: string, hostToken: string) {
  return prisma.event.findFirst({
    where: { id: eventId, hostToken },
    include: {
      slots: { orderBy: { sortOrder: "asc" } },
      responses: {
        orderBy: { createdAt: "asc" },
        include: { answers: true },
      },
    },
  });
}

export function validateAnswersForEvent(
  slotIds: string[],
  answers: { slotId: string; status: string }[],
): string | null {
  const slotIdSet = new Set(slotIds);

  if (answers.length !== slotIds.length) {
    return "すべての候補日に回答してください";
  }

  const seen = new Set<string>();
  for (const answer of answers) {
    if (!slotIdSet.has(answer.slotId)) {
      return "無効な候補日が含まれています";
    }
    if (seen.has(answer.slotId)) {
      return "同じ候補日への重複回答があります";
    }
    seen.add(answer.slotId);
  }

  return null;
}

export function sortSlotsByStartAt<T extends CreateSlotInput>(slots: T[]): T[] {
  return [...slots].sort((a, b) => {
    const aDate = parseSlotStartAt(a).getTime();
    const bDate = parseSlotStartAt(b).getTime();
    return aDate - bDate;
  });
}
