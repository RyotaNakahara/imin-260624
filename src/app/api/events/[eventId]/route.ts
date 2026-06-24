import {
  findEventOrNull,
  jsonError,
  serializeEventBase,
} from "@/lib/events";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  const event = await findEventOrNull(eventId);
  if (!event) {
    return jsonError("予定が見つかりません", 404);
  }

  return Response.json(serializeEventBase(event));
}
