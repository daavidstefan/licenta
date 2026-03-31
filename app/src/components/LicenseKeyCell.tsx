"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

function maskKey(key: string, start = 4, end = 4) {
  if (key.length <= start + end) return key;
  return `${key.slice(0, start)}...${key.slice(-end)}`;
}

export function LicenseKeyCell({ value }: { value: string }) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    toast.success("Cheie copiată!");
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono tracking-tight">{maskKey(value)}</span>
      <button
        type="button"
        className="inline-flex p-2 rounded-md hover:bg-accent cursor-pointer"
        aria-label="Copiază cheia"
        onClick={handleCopy}
      >
        <Copy className="size-4" />
      </button>
    </div>
  );
}
