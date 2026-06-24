type ResponseAnswer = {
  slotId: string;
  status: "available" | "unavailable";
};

type GuestResponse = {
  id: string;
  displayName: string;
  answers: ResponseAnswer[];
};

type EventSlot = {
  id: string;
  label: string;
};

type ResponseMatrixProps = {
  slots: EventSlot[];
  responses: GuestResponse[];
};

function renderAnswer(status: ResponseAnswer["status"] | undefined): string {
  if (status === "available") return "○";
  if (status === "unavailable") return "×";
  return "-";
}

export function ResponseMatrix({ slots, responses }: ResponseMatrixProps) {
  if (responses.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
        まだ回答はありません。ゲスト用 URL を共有してください。
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-zinc-200">
      <table className="min-w-full text-sm">
        <thead className="bg-zinc-50 text-left text-zinc-700">
          <tr>
            <th className="sticky left-0 z-10 bg-zinc-50 px-3 py-2 font-medium">
              名前
            </th>
            {slots.map((slot) => (
              <th key={slot.id} className="px-3 py-2 font-medium whitespace-nowrap">
                {slot.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {responses.map((response) => (
            <tr key={response.id} className="border-t border-zinc-200">
              <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-zinc-900">
                {response.displayName}
              </td>
              {slots.map((slot) => {
                const answer = response.answers.find(
                  (item) => item.slotId === slot.id,
                );
                return (
                  <td
                    key={slot.id}
                    className="px-3 py-2 text-center text-base text-zinc-800"
                  >
                    {renderAnswer(answer?.status)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
