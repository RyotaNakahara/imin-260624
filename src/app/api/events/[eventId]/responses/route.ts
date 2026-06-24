import { AnswerStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { isPastDeadline } from "@/lib/datetime";
import {
  findEventOrNull,
  jsonError,
  serializeGuestResponse,
  validateAnswersForEvent,
} from "@/lib/events";
import { createResponseSchema } from "@/lib/schemas";
import { generateId, generateResponseToken } from "@/lib/tokens";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  const event = await findEventOrNull(eventId);
  if (!event) {
    return jsonError("予定が見つかりません", 404);
  }

  if (isPastDeadline(event.deadline)) {
    return jsonError("回答期限を過ぎています", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("リクエストボディが不正です", 400);
  }

  const parsed = createResponseSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "入力が不正です", 400);
  }

  const slotIds = event.slots.map((slot) => slot.id);
  const validationError = validateAnswersForEvent(slotIds, parsed.data.answers);
  if (validationError) {
    return jsonError(validationError, 400);
  }

  const responseId = generateId();
  const responseToken = generateResponseToken();

  const response = await prisma.response.create({
    data: {
      id: responseId,
      eventId,
      responseToken,
      displayName: parsed.data.displayName,
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

  return Response.json(serializeGuestResponse(response), { status: 201 });
}
