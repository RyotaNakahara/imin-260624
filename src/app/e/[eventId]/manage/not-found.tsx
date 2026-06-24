import Link from "next/link";

export default function ManageNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-12">
      <section className="rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold text-zinc-900">
          管理画面を表示できません
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          予定が見つからないか、管理用 URL が無効です。
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          トップへ戻る
        </Link>
      </section>
    </main>
  );
}
