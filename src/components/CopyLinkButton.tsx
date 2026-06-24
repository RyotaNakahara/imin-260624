"use client";

import { useState } from "react";

type CopyLinkButtonProps = {
  value: string;
  className?: string;
};

export function CopyLinkButton({ value, className }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setError(null);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("コピーに失敗しました");
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
      >
        {copied ? "コピーしました" : "URLをコピー"}
      </button>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
