import { prisma } from "@/lib/db";
import { findEventOrNull, jsonError } from "@/lib/events";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  const event = await findEventOrNull(eventId);
  if (!event) {
    return jsonError("予定が見つかりません", 404);
  }

  const slotIds = event.slots.map((slot) => slot.id);

  const counts = await prisma.answer.groupBy({
    by: ["slotId", "status"],
    where: {
      slotId: { in: slotIds },
    },
    _count: { _all: true },
  });

  const summaryMap = new Map(
    slotIds.map((slotId) => [
      slotId,
      { slotId, available: 0, unavailable: 0 },
    ]),
  );

  for (const row of counts) {
    const entry = summaryMap.get(row.slotId);
    if (!entry) continue;

    if (row.status === "available") {
      entry.available = row._count._all;
    } else if (row.status === "unavailable") {
      entry.unavailable = row._count._all;
    }
  }

  const slots = [...event.slots]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((slot) => summaryMap.get(slot.id)!);

  return Response.json({ slots });
}
