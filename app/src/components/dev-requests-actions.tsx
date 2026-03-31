"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function DevRequestActions({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approved" | "rejected" | null>(null);

  const updateStatus = async (status: "approved" | "rejected") => {
    try {
      setLoading(status);

      const res = await fetch(`/api/dev-requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Nu am putut actualiza cererea.");
      }

      if (data?.warning) {
        toast.warning(data.warning);
      } else {
        toast.success(
          status === "approved"
            ? "Cererea a fost aprobată."
            : "Cererea a fost respinsă.",
        );
      }

      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "A apărut o eroare.");
    } finally {
      setLoading(null);
    }
  };

  const isPending = currentStatus === "pending";

  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        variant="success"
        onClick={() => updateStatus("approved")}
        disabled={!isPending || loading !== null}
      >
        {loading === "approved" ? "Se aprobă..." : "Aprobă"}
      </Button>

      <Button
        variant="destructive"
        onClick={() => updateStatus("rejected")}
        disabled={!isPending || loading !== null}
      >
        {loading === "rejected" ? "Se respinge..." : "Respinge"}
      </Button>
    </div>
  );
}
