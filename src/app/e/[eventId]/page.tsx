import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { formatJstDateTime } from "@/lib/datetime";
import { GuestResponseForm } from "@/components/GuestResponseForm";

type EventSlot = {
  id: string;
  type: "date" | "datetime";
  startAt: string;
  label: string;
  sortOrder: number;
};

type EventResponse = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  deadlinePassed: boolean;
  slots: EventSlot[];
};

async function fetchEvent(eventId: string): Promise<EventResponse> {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const url = `${protocol}://${host}/api/events/${encodeURIComponent(eventId)}`;

  const response = await fetch(url, { cache: "no-store" });
  if (response.status === 404) {
    notFound();
  }
  if (!response.ok) {
    throw new Error("予定情報の取得に失敗しました");
  }

  return (await response.json()) as EventResponse;
}

export default async function GuestEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await fetchEvent(eventId);
  const deadlineText = event.deadline
    ? formatJstDateTime(new Date(event.deadline))
    : "未設定";

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
          <h1 className="text-xl font-bold text-zinc-900">{event.title}</h1>
          {event.description ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
              {event.description}
            </p>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">
              説明は設定されていません。
            </p>
          )}
          <p className="mt-4 text-sm text-zinc-600">
            回答期限: <span className="font-medium text-zinc-800">{deadlineText}</span>
          </p>
        </section>

        <GuestResponseForm
          eventId={eventId}
          eventTitle={event.title}
          deadlinePassed={event.deadlinePassed}
          slots={event.slots.map((slot) => ({ id: slot.id, label: slot.label }))}
        />
      </div>
    </main>
  );
}
