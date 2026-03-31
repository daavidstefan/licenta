"use client";

import { Badge } from "@/components/ui/badge";

export function EmailStatusCell({ value }: { value: string }) {
  let variant: "success" | "warning" | "destructive";
  let label;
  if (value === "verified") {
    variant = "success";
    label = "Verificat!";
  } else if (value === "unverified") {
    variant = "destructive";
    label = "Necesită verificare!";
  } else {
    variant = "destructive";
    label = "contact an admin";
  }
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant={variant} className="capitalize">
        {label}
      </Badge>
    </div>
  );
}
