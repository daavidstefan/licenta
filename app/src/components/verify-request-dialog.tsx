"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function VerifyRequestDialog() {
  const [requestId, setRequestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleVerify = async () => {
    if (!requestId.trim()) {
      toast.error("Trebuie să introduci un ID de cerere.");
      return;
    }

    setLoading(true);

    console.log("Se verifică ID-ul:", requestId.trim());
    toast.info(`Verificăm statusul pentru ${requestId.trim()}...`);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setLoading(false);
    setOpen(false);

    toast.success("Verificare simulată. Vezi consola pentru ID.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Verifică statusul cererii</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verificare Status Cerere</DialogTitle>
          <DialogDescription>
            Introdu ID-ul (cheia) pe care l-ai primit la înregistrarea cererii.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="request-id-verify" className="text-sm font-medium">
            ID Cerere
          </Label>
          <Input
            id="request-id-verify"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            placeholder="ex: a0eebc99-9c0b-4ef8-bb6d-..."
            disabled={loading}
          />
        </div>

        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={loading}>
              Anulează
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleVerify} disabled={loading}>
            {loading ? "Se verifică..." : "Verifică"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
