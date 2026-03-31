"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DevRequestActions({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approved" | "rejected" | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [reviewReason, setReviewReason] = useState("");

  const updateStatus = async (status: "approved" | "rejected") => {
    try {
      setLoading(status);

      let reviewReason: string | null = null;

      if (status === "rejected") {
        reviewReason = window.prompt("Introdu motivul respingerii:");
        if (!reviewReason || !reviewReason.trim()) {
          setLoading(null);
          toast.error("Motivul respingerii este obligatoriu.");
          return;
        }
      }

      const res = await fetch(`/api/dev-requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          reviewReason,
        }),
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

  const normalizedStatus = currentStatus.trim().toLowerCase();
  const isPending = normalizedStatus === "pending";

  const approveRequest = async () => {
    try {
      setLoading("approved");

      const res = await fetch(`/api/dev-requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "approved",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Nu am putut actualiza cererea.");
      }

      if (data?.warning) {
        toast.warning(data.warning);
      } else {
        toast.success("Cererea a fost aprobată.");
      }

      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "A apărut o eroare.");
    } finally {
      setLoading(null);
    }
  };

  const submitReject = async () => {
    if (!reviewReason.trim()) {
      toast.error("Motivul respingerii este obligatoriu.");
      return;
    }

    try {
      setLoading("rejected");

      const res = await fetch(`/api/dev-requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "rejected",
          reviewReason: reviewReason.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Nu am putut actualiza cererea.");
      }

      toast.success("Cererea a fost respinsă.");

      setRejectDialogOpen(false);
      setReviewReason("");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "A apărut o eroare.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        onClick={approveRequest}
        disabled={!isPending || loading !== null}
      >
        {loading === "approved" ? "Se aprobă..." : "Aprobă"}
      </Button>

      <Button
        variant="destructive"
        onClick={() => setRejectDialogOpen(true)}
        disabled={!isPending || loading !== null}
      >
        {loading === "rejected" ? "Se respinge..." : "Respinge"}
      </Button>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Motiv respingere</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Textarea
              id="review-reason"
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              placeholder="Scrie motivul respingerii..."
              disabled={loading === "rejected"}
              className="h-[160px] resize-none overflow-y-auto overflow-x-hidden"
              style={{ overflowWrap: "anywhere" }}
            />
          </div>

          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                disabled={loading === "rejected"}
              >
                Anulează
              </Button>
            </DialogClose>

            <Button
              type="button"
              variant="destructive"
              onClick={submitReject}
              disabled={loading === "rejected"}
            >
              {loading === "rejected"
                ? "Se respinge..."
                : "Confirmă respingerea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
