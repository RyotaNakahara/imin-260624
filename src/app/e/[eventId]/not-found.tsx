import Link from "next/link";

export default function GuestEventNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8">
      <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-zinc-200">
        <h1 className="text-lg font-bold text-zinc-900">
          予定が見つかりませんでした
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          URL が誤っているか、予定が削除されている可能性があります。
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          トップへ戻る
        </Link>
      </div>
    </main>
  );
}
