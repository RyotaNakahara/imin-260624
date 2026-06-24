import { POST as createEvent } from "@/app/api/events/route";

export const sampleSlots = [
  { type: "date" as const, startAt: "2026-07-01" },
  { type: "datetime" as const, startAt: "2026-07-02T14:00" },
];

export async function createSampleEvent(
  overrides: {
    title?: string;
    description?: string | null;
    deadline?: string | null;
    slots?: typeof sampleSlots;
  } = {},
) {
  const request = new Request("http://localhost:3000/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json", host: "localhost:3000" },
    body: JSON.stringify({
      title: overrides.title ?? "テスト予定",
      description: overrides.description ?? "説明文",
      deadline: overrides.deadline ?? null,
      slots: overrides.slots ?? sampleSlots,
    }),
  });

  const response = await createEvent(request);
  const body = await response.json();
  return { response, body };
}
