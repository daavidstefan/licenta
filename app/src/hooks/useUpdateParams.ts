// hook care actualizeaza parametrii din url pentru filtrare

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useUpdateParams() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  return (
    updates: Record<string, string | null>,
    mode: "push" | "replace" = "push"
  ) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    mode === "push" ? router.push(url) : router.replace(url);
    return url;
  };
}
