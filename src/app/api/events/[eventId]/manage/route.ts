import {
  findEventForManage,
  jsonError,
  serializeEventBase,
  serializeGuestResponse,
} from "@/lib/events";
import { hostTokenQuerySchema } from "@/lib/schemas";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { eventId } = await context.params;
  const { searchParams } = new URL(request.url);

  const tokenResult = hostTokenQuerySchema.safeParse({
    token: searchParams.get("token") ?? "",
  });
  if (!tokenResult.success) {
    return jsonError("予定が見つかりません", 404);
  }

  const event = await findEventForManage(eventId, tokenResult.data.token);
  if (!event) {
    return jsonError("予定が見つかりません", 404);
  }

  return Response.json({
    ...serializeEventBase(event, { includeHostToken: true }),
    responses: event.responses.map(serializeGuestResponse),
  });
}
