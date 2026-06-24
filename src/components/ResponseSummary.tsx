type ResponseSummaryItem = {
  slotId: string;
  label: string;
  available: number;
  unavailable: number;
};

type ResponseSummaryProps = {
  items: ResponseSummaryItem[];
};

export function ResponseSummary({ items }: ResponseSummaryProps) {
  const maxAvailable = Math.max(...items.map((item) => item.available), 0);
  const hasResponses = items.some(
    (item) => item.available > 0 || item.unavailable > 0,
  );

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
      <h2 className="text-lg font-semibold text-zinc-900">回答サマリー</h2>
      {!hasResponses ? (
        <p className="mt-3 text-sm text-zinc-600">
          まだ回答はありません。最初の回答者になりましょう。
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((summary) => {
            const isBest =
              maxAvailable > 0 && summary.available === maxAvailable;
            return (
              <div
                key={summary.slotId}
                className={`rounded-md border px-3 py-3 ${
                  isBest
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-zinc-200 bg-zinc-50"
                }`}
              >
                <p className="text-sm font-medium text-zinc-900">
                  {summary.label}
                </p>
                <p className="mt-1 text-sm text-zinc-700">
                  出席可:{" "}
                  <span className="font-semibold">{summary.available}</span>
                  {" / "}
                  出席不可:{" "}
                  <span className="font-semibold">{summary.unavailable}</span>
                </p>
                {isBest ? (
                  <p className="mt-1 text-xs font-medium text-emerald-700">
                    最多の出席可
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
