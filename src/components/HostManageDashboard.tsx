"use client";

import { useMemo } from "react";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { EventEditForm } from "@/components/EventEditForm";
import { ResponseMatrix } from "@/components/ResponseMatrix";
import { ResponseSummary } from "@/components/ResponseSummary";
import { formatJstDateTime } from "@/lib/datetime";

type ManageSlot = {
  id: string;
  type: "date" | "datetime";
  startAt: string;
  label: string;
};

type ManageResponse = {
  id: string;
  displayName: string;
  answers: Array<{
    slotId: string;
    status: "available" | "unavailable";
  }>;
};

type ManageEventData = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  deadlinePassed: boolean;
  slots: ManageSlot[];
  responses: ManageResponse[];
};

type HostManageDashboardProps = {
  eventId: string;
  hostToken: string;
  guestUrl: string;
  data: ManageEventData;
};

export function HostManageDashboard({
  eventId,
  hostToken,
  guestUrl,
  data,
}: HostManageDashboardProps) {
  const slotSummaries = useMemo(() => {
    return data.slots.map((slot) => {
      const available = data.responses.filter((response) =>
        response.answers.some(
          (answer) =>
            answer.slotId === slot.id && answer.status === "available",
        ),
      ).length;
      const unavailable = data.responses.filter((response) =>
        response.answers.some(
          (answer) =>
            answer.slotId === slot.id && answer.status === "unavailable",
        ),
      ).length;
      return {
        slotId: slot.id,
        label: slot.label,
        available,
        unavailable,
      };
    });
  }, [data.responses, data.slots]);

  const slotsWithAnswers = useMemo(() => {
    const ids = new Set<string>();
    for (const response of data.responses) {
      for (const answer of response.answers) {
        ids.add(answer.slotId);
      }
    }
    return [...ids];
  }, [data.responses]);

  const deadlineText = data.deadline
    ? formatJstDateTime(new Date(data.deadline))
    : "未設定";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-5">
      <div className="space-y-6">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-zinc-900">{data.title}</h1>
          <p className="mt-2 text-sm text-zinc-600">
            回答期限: <span className="font-medium text-zinc-800">{deadlineText}</span>
            {data.deadlinePassed ? (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                期限切れ
              </span>
            ) : null}
          </p>

          <div className="mt-5 space-y-2">
            <h2 className="text-sm font-semibold text-zinc-800">ゲスト用 URL</h2>
            <p className="break-all rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-800">
              {guestUrl}
            </p>
            <CopyLinkButton value={guestUrl} />
            <p className="text-xs text-zinc-500">
              この URL をゲストに共有してください。ホスト管理用 URL は他人に共有しないでください。
            </p>
          </div>
        </section>

        <ResponseSummary items={slotSummaries} />

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">回答一覧</h2>
          <div className="mt-4">
            <ResponseMatrix slots={data.slots} responses={data.responses} />
          </div>
        </section>

        <EventEditForm
          eventId={eventId}
          hostToken={hostToken}
          initialTitle={data.title}
          initialDescription={data.description}
          initialDeadline={data.deadline}
          initialSlots={data.slots}
          slotsWithAnswers={slotsWithAnswers}
        />
      </div>
    </main>
  );
}
