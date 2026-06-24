import { prisma } from "@/lib/db";
import { validateFutureDeadline } from "@/lib/datetime";
import {
  findEventForManage,
  findEventOrNull,
  hasDuplicateSlots,
  jsonError,
  parseDeadlineInput,
  parseSlotStartAt,
  serializeEventBase,
  serializeGuestResponse,
  sortSlotsByStartAt,
} from "@/lib/events";
import { generateId } from "@/lib/tokens";
import { updateEventSchema, type UpdateSlotInput } from "@/lib/schemas";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

async function syncSlots(
  eventId: string,
  incomingSlots: UpdateSlotInput[],
): Promise<void> {
  const existingSlots = await prisma.slot.findMany({
    where: { eventId },
  });
  const existingIds = new Set(existingSlots.map((slot) => slot.id));
  const incomingIds = new Set(
    incomingSlots.flatMap((slot) => (slot.id ? [slot.id] : [])),
  );

  for (const slot of existingSlots) {
    if (!incomingIds.has(slot.id)) {
      await prisma.slot.delete({ where: { id: slot.id } });
    }
  }

  const sortedSlots = sortSlotsByStartAt(incomingSlots);
  for (let index = 0; index < sortedSlots.length; index++) {
    const slot = sortedSlots[index];
    const startAt = parseSlotStartAt(slot);

    if (slot.id && existingIds.has(slot.id)) {
      await prisma.slot.update({
        where: { id: slot.id },
        data: {
          type: slot.type,
          startAt,
          sortOrder: index,
        },
      });
      continue;
    }

    await prisma.slot.create({
      data: {
        id: generateId(),
        eventId,
        type: slot.type,
        startAt,
        sortOrder: index,
      },
    });
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  const event = await findEventOrNull(eventId);
  if (!event) {
    return jsonError("予定が見つかりません", 404);
  }

  return Response.json(serializeEventBase(event));
}

export async function PATCH(request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("リクエストボディが不正です", 400);
  }

  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "入力が不正です", 400);
  }

  const { hostToken, title, description, deadline, slots } = parsed.data;

  const event = await prisma.event.findFirst({
    where: { id: eventId, hostToken },
  });
  if (!event) {
    return jsonError("予定が見つかりません", 404);
  }

  let deadlineDate: Date | null | undefined;
  if (deadline !== undefined) {
    try {
      deadlineDate = parseDeadlineInput(deadline);
    } catch {
      return jsonError("回答期限の形式が正しくありません", 400);
    }

    const deadlineError = validateFutureDeadline(deadlineDate ?? null);
    if (deadlineError) {
      return jsonError(deadlineError, 400);
    }
  }

  if (slots !== undefined) {
    try {
      if (hasDuplicateSlots(slots)) {
        return jsonError("同じ候補日が重複しています", 400);
      }

      await prisma.$transaction(async () => {
        if (title !== undefined || description !== undefined || deadline !== undefined) {
          await prisma.event.update({
            where: { id: eventId },
            data: {
              ...(title !== undefined ? { title } : {}),
              ...(description !== undefined
                ? { description: description ?? null }
                : {}),
              ...(deadline !== undefined ? { deadline: deadlineDate ?? null } : {}),
            },
          });
        }
        await syncSlots(eventId, slots);
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "候補日の形式が正しくありません";
      return jsonError(message, 400);
    }
  } else {
    await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined
          ? { description: description ?? null }
          : {}),
        ...(deadline !== undefined ? { deadline: deadlineDate ?? null } : {}),
      },
    });
  }

  const updated = await findEventForManage(eventId, hostToken);
  if (!updated) {
    return jsonError("予定が見つかりません", 404);
  }

  return Response.json({
    ...serializeEventBase(updated, { includeHostToken: true }),
    responses: updated.responses.map(serializeGuestResponse),
  });
}
