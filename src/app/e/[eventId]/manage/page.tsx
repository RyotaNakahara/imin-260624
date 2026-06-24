import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { HostManageDashboard } from "@/components/HostManageDashboard";

type ManageEventData = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  deadlinePassed: boolean;
  slots: Array<{
    id: string;
    type: "date" | "datetime";
    startAt: string;
    label: string;
  }>;
  responses: Array<{
    id: string;
    displayName: string;
    answers: Array<{
      slotId: string;
      status: "available" | "unavailable";
    }>;
  }>;
};

async function fetchManageEvent(
  eventId: string,
  token: string,
): Promise<ManageEventData | null> {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const url = `${protocol}://${host}/api/events/${encodeURIComponent(eventId)}/manage?token=${encodeURIComponent(token)}`;

  const response = await fetch(url, { cache: "no-store" });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("管理情報の取得に失敗しました");
  }

  return (await response.json()) as ManageEventData;
}

export default async function ManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { eventId } = await params;
  const { token } = await searchParams;

  if (!token) {
    notFound();
  }

  const data = await fetchManageEvent(eventId, token);
  if (!data) {
    notFound();
  }

  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const guestUrl = `${protocol}://${host}/e/${eventId}`;

  return (
    <HostManageDashboard
      eventId={eventId}
      hostToken={token}
      guestUrl={guestUrl}
      data={data}
    />
  );
}
