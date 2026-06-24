import { AnswerStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { isPastDeadline } from "@/lib/datetime";
import {
  findEventOrNull,
  jsonError,
  serializeGuestResponse,
  validateAnswersForEvent,
} from "@/lib/events";
import { updateResponseSchema } from "@/lib/schemas";
import { generateId } from "@/lib/tokens";

type RouteContext = {
  params: Promise<{ eventId: string; responseToken: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { eventId, responseToken } = await context.params;

  const event = await findEventOrNull(eventId);
  if (!event) {
    return jsonError("予定が見つかりません", 404);
  }

  const existing = await prisma.response.findFirst({
    where: { eventId, responseToken },
    include: { answers: true },
  });
  if (!existing) {
    return jsonError("回答が見つかりません", 404);
  }

  return Response.json(serializeGuestResponse(existing));
}

export async function PUT(request: Request, context: RouteContext) {
  const { eventId, responseToken } = await context.params;

  const event = await findEventOrNull(eventId);
  if (!event) {
    return jsonError("予定が見つかりません", 404);
  }

  if (isPastDeadline(event.deadline)) {
    return jsonError("回答期限を過ぎています", 403);
  }

  const existing = await prisma.response.findFirst({
    where: { eventId, responseToken },
    include: { answers: true },
  });
  if (!existing) {
    return jsonError("回答が見つかりません", 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("リクエストボディが不正です", 400);
  }

  const parsed = updateResponseSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "入力が不正です", 400);
  }

  const slotIds = event.slots.map((slot) => slot.id);
  const validationError = validateAnswersForEvent(slotIds, parsed.data.answers);
  if (validationError) {
    return jsonError(validationError, 400);
  }

  const response = await prisma.$transaction(async (tx) => {
    await tx.answer.deleteMany({ where: { responseId: existing.id } });

    return tx.response.update({
      where: { id: existing.id },
      data: {
        displayName: parsed.data.displayName ?? existing.displayName,
        ...(parsed.data.comment !== undefined
          ? { comment: parsed.data.comment?.trim() || null }
          : {}),
        answers: {
          create: parsed.data.answers.map((answer) => ({
            id: generateId(),
            slotId: answer.slotId,
            status: answer.status as AnswerStatus,
          })),
        },
      },
      include: { answers: true },
    });
  });

  return Response.json(serializeGuestResponse(response));
}
