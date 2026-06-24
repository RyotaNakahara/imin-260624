"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { AnswerStatus } from "@/lib/schemas";

type SlotOption = {
  id: string;
  label: string;
};

type GuestResponseFormProps = {
  eventId: string;
  eventTitle: string;
  deadlinePassed: boolean;
  slots: SlotOption[];
};

type SubmitResult = {
  responseToken: string;
};

const RESPONSE_TOKEN_COOKIE_PREFIX = "imin_response_token_";

function getResponseTokenCookie(eventId: string): string | null {
  if (typeof document === "undefined") return null;

  const cookieKey = `${RESPONSE_TOKEN_COOKIE_PREFIX}${eventId}=`;
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(cookieKey));

  if (!cookie) return null;
  const value = cookie.slice(cookieKey.length);
  return value ? decodeURIComponent(value) : null;
}

function setResponseTokenCookie(eventId: string, token: string): void {
  if (typeof document === "undefined") return;
  const key = `${RESPONSE_TOKEN_COOKIE_PREFIX}${eventId}`;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${key}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function clearResponseTokenCookie(eventId: string): void {
  if (typeof document === "undefined") return;
  const key = `${RESPONSE_TOKEN_COOKIE_PREFIX}${eventId}`;
  document.cookie = `${key}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function buildAnswersFromSlots(
  slots: SlotOption[],
  existingAnswers?: { slotId: string; status: AnswerStatus }[],
): Record<string, AnswerStatus> {
  const answerMap = new Map(
    existingAnswers?.map((answer) => [answer.slotId, answer.status]) ?? [],
  );
  return slots.reduce<Record<string, AnswerStatus>>((acc, slot) => {
    acc[slot.id] = answerMap.get(slot.id) ?? "unavailable";
    return acc;
  }, {});
}

type ExistingResponse = {
  displayName: string;
  comment: string | null;
  answers: { slotId: string; status: AnswerStatus }[];
};

export function GuestResponseForm({
  eventId,
  eventTitle,
  deadlinePassed,
  slots,
}: GuestResponseFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [storedToken, setStoredToken] = useState<string | null>(() =>
    getResponseTokenCookie(eventId),
  );
  const [answers, setAnswers] = useState<Record<string, AnswerStatus>>(() =>
    buildAnswersFromSlots(slots),
  );

  useEffect(() => {
    if (!storedToken || deadlinePassed) return;

    let cancelled = false;

    async function loadExistingResponse() {
      setLoadingExisting(true);
      try {
        const response = await fetch(
          `/api/events/${encodeURIComponent(eventId)}/responses/${encodeURIComponent(storedToken!)}`,
        );

        if (response.status === 404) {
          clearResponseTokenCookie(eventId);
          if (!cancelled) {
            setStoredToken(null);
          }
          return;
        }

        if (!response.ok) return;

        const data = (await response.json()) as ExistingResponse;
        if (cancelled) return;

        setDisplayName(data.displayName);
        setComment(data.comment ?? "");
        setAnswers(buildAnswersFromSlots(slots, data.answers));
      } finally {
        if (!cancelled) {
          setLoadingExisting(false);
        }
      }
    }

    void loadExistingResponse();

    return () => {
      cancelled = true;
    };
  }, [deadlinePassed, eventId, slots, storedToken]);

  const answerList = useMemo(
    () =>
      slots.map((slot) => ({
        slotId: slot.id,
        status: answers[slot.id] ?? "unavailable",
      })),
    [answers, slots],
  );

  const submitResponse = async (token: string | null): Promise<SubmitResult> => {
    const payload = {
      displayName,
      comment: comment.trim() || null,
      answers: answerList,
    };

    const isUpdateMode = Boolean(token);
    const endpoint = isUpdateMode
      ? `/api/events/${encodeURIComponent(eventId)}/responses/${encodeURIComponent(token!)}`
      : `/api/events/${encodeURIComponent(eventId)}/responses`;
    const method = isUpdateMode ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => ({}))) as
      | { error?: string; responseToken?: string }
      | undefined;

    if (response.ok && data?.responseToken) {
      return { responseToken: data.responseToken };
    }

    if (response.status === 404 && isUpdateMode) {
      clearResponseTokenCookie(eventId);
      setStoredToken(null);
      return submitResponse(null);
    }

    throw new Error(data?.error ?? "回答の送信に失敗しました");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (deadlinePassed) {
      setErrorMessage("回答期限を過ぎています。回答は更新できません。");
      return;
    }

    setSubmitting(true);
    try {
      const usedUpdateMode = Boolean(storedToken);
      const result = await submitResponse(storedToken);
      setResponseTokenCookie(eventId, result.responseToken);
      setStoredToken(result.responseToken);
      setSuccessMessage(
        usedUpdateMode
          ? "回答を更新しました。"
          : "回答を送信しました。再編集できるよう保存しています。",
      );
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "回答の送信に失敗しました";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">回答入力</h2>
        <span className="text-xs text-zinc-500">
          {storedToken ? "再回答モード" : "新規回答モード"}
        </span>
      </div>
      <p className="mt-1 text-sm text-zinc-600">
        「{eventTitle}」への参加可否を入力してください。
      </p>

      {deadlinePassed ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          回答期限を過ぎています。現在は閲覧のみ可能です。
        </div>
      ) : (
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        {loadingExisting ? (
          <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
            前回の回答を読み込んでいます...
          </p>
        ) : null}
        <div>
          <label
            htmlFor="displayName"
            className="mb-1 block text-sm font-medium text-zinc-800"
          >
            表示名
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={deadlinePassed || submitting || loadingExisting}
            maxLength={50}
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 disabled:cursor-not-allowed disabled:bg-zinc-100"
            placeholder="例: 山田 太郎"
          />
        </div>

        <div>
          <label
            htmlFor="comment"
            className="mb-1 block text-sm font-medium text-zinc-800"
          >
            コメント
            <span className="ml-1 font-normal text-zinc-500">（任意）</span>
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={deadlinePassed || submitting || loadingExisting}
            maxLength={500}
            rows={3}
            className="w-full resize-y rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 disabled:cursor-not-allowed disabled:bg-zinc-100"
            placeholder="例: 夕方以降なら調整できるかもしれません"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-800">候補日ごとの回答</p>
          {slots.map((slot) => {
            const current = answers[slot.id] ?? "unavailable";
            return (
              <div
                key={slot.id}
                className="rounded-lg border border-zinc-200 p-3 sm:flex sm:items-center sm:justify-between"
              >
                <p className="text-sm font-medium text-zinc-900">{slot.label}</p>
                <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
                  <button
                    type="button"
                    disabled={deadlinePassed || submitting || loadingExisting}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [slot.id]: "available" }))
                    }
                    className={`rounded-md px-3 py-1.5 text-sm transition ${
                      current === "available"
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    出席可
                  </button>
                  <button
                    type="button"
                    disabled={deadlinePassed || submitting || loadingExisting}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [slot.id]: "tentative" }))
                    }
                    className={`rounded-md px-3 py-1.5 text-sm transition ${
                      current === "tentative"
                        ? "bg-amber-500 text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    未定
                  </button>
                  <button
                    type="button"
                    disabled={deadlinePassed || submitting || loadingExisting}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [slot.id]: "unavailable" }))
                    }
                    className={`rounded-md px-3 py-1.5 text-sm transition ${
                      current === "unavailable"
                        ? "bg-rose-600 text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    出席不可
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {errorMessage ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {successMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={deadlinePassed || submitting || loadingExisting}
          className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {loadingExisting
            ? "読み込み中..."
            : submitting
              ? "送信中..."
              : storedToken
                ? "回答を更新"
                : "回答を送信"}
        </button>
        </form>
      )}
    </section>
  );
}
