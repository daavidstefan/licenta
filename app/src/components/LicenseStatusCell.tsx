"use client";

import { Badge } from "@/components/ui/badge";

export function LicenseStatusCell({ value }: { value: string }) {
  let variant: "success" | "warning" | "destructive";
  let label;
  if (value === "active") {
    variant = "success";
    label = "Activă";
  } else if (value === "expires-soon") {
    variant = "warning";
    label = "Expiră curând";
  } else {
    variant = "destructive";
    label = "Expirată";
  }
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant={variant} className="capitalize">
        {label}
      </Badge>
    </div>
  );
}
