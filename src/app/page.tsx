import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-12">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          予定調整をかんたんに
        </h1>
        <p className="mt-3 text-sm leading-7 text-zinc-600 sm:text-base">
          ログイン不要で予定を作成し、ゲストに URL を共有して回答を集められます。
        </p>

        <div className="mt-6">
          <Link
            href="/new"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            新しい予定を作成
          </Link>
        </div>
      </section>
    </main>
  );
}
