import { prisma } from "@/lib/db";
import {
  getBaseUrl,
  jsonError,
  parseDeadlineInput,
  parseSlotStartAt,
  sortSlotsByStartAt,
} from "@/lib/events";
import { createEventSchema } from "@/lib/schemas";
import {
  generateEventId,
  generateHostToken,
  generateId,
} from "@/lib/tokens";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("リクエストボディが不正です", 400);
  }

  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "入力が不正です", 400);
  }

  const { title, description, deadline, slots } = parsed.data;

  let deadlineDate: Date | null;
  try {
    deadlineDate = parseDeadlineInput(deadline);
  } catch {
    return jsonError("回答期限の形式が正しくありません", 400);
  }

  const sortedSlots = sortSlotsByStartAt(slots);
  const eventId = generateEventId();
  const hostToken = generateHostToken();

  let slotCreates;
  try {
    slotCreates = sortedSlots.map((slot, index) => ({
      id: generateId(),
      type: slot.type,
      startAt: parseSlotStartAt(slot),
      sortOrder: index,
    }));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "候補日の形式が正しくありません";
    return jsonError(message, 400);
  }

  await prisma.event.create({
    data: {
      id: eventId,
      hostToken,
      title,
      description: description ?? null,
      deadline: deadlineDate,
      slots: {
        create: slotCreates,
      },
    },
  });

  const baseUrl = getBaseUrl(request);
  return Response.json(
    {
      eventId,
      hostToken,
      urls: {
        guest: `${baseUrl}/e/${eventId}`,
        host: `${baseUrl}/e/${eventId}/manage?token=${hostToken}`,
        created: `${baseUrl}/e/${eventId}/created?token=${hostToken}`,
      },
    },
    { status: 201 },
  );
}
