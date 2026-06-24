"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CopyLinkButton } from "@/components/CopyLinkButton";

export default function CreatedPage() {
  const params = useParams<{ eventId: string }>();
  const searchParams = useSearchParams();
  const [origin, setOrigin] = useState("");
  const eventId = params.eventId;
  const token = searchParams.get("token");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const guestPath = useMemo(() => `/e/${eventId}`, [eventId]);
  const hostPath = useMemo(
    () => (token ? `/e/${eventId}/manage?token=${token}` : ""),
    [eventId, token],
  );
  const guestUrl = origin ? `${origin}${guestPath}` : guestPath;
  const hostUrl = origin && hostPath ? `${origin}${hostPath}` : hostPath;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">予定を作成しました</h1>
        <p className="mt-2 text-sm text-zinc-600">
          以下の URL を共有して回答を集めてください。
        </p>

        <section className="mt-6 space-y-2">
          <h2 className="text-sm font-semibold text-zinc-800">ゲスト用 URL</h2>
          <p className="break-all rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-800">
            {guestUrl}
          </p>
          <CopyLinkButton value={guestUrl} />
        </section>

        <section className="mt-6 space-y-2">
          <h2 className="text-sm font-semibold text-zinc-800">ホスト管理用 URL</h2>
          {hostUrl ? (
            <>
              <p className="break-all rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-800">
                {hostUrl}
              </p>
              <CopyLinkButton value={hostUrl} />
              <p className="text-xs text-zinc-500">
                この URL は管理者専用です。取り扱いに注意してください。
              </p>
            </>
          ) : (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
              token が見つからないため、ホスト管理用 URL を表示できませんでした。
            </p>
          )}
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={guestPath}
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            ゲスト画面を確認
          </Link>
          {hostPath ? (
            <Link
              href={hostPath}
              className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              管理画面を開く
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
