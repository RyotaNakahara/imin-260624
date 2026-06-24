import type { Metadata } from "next";
import Link from "next/link";
import { EventForm } from "@/components/EventForm";

export const metadata: Metadata = {
  title: "予定を作成",
};

export default function NewEventPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-zinc-600 underline">
          トップに戻る
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-zinc-900">予定を作成</h1>
        <p className="mt-2 text-sm text-zinc-600">
          候補日を登録すると、作成後に共有用 URL が発行されます。
        </p>
      </div>

      <EventForm />
    </main>
  );
}
