"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Check, Copy } from "lucide-react";

export default function DevRegisterPage() {
  const router = useRouter();

  // stare noua pentru form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [motivation, setMotivation] = useState("");

  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submittedId, setSubmittedId] = useState("");
  const [copied, setCopied] = useState(false);

  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyIdInput, setVerifyIdInput] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(submittedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyRequest = () => {
    setVerifyDialogOpen(true);
  };

  const handleVerifySubmit = async () => {
    if (!verifyIdInput.trim()) {
      toast.error("Trebuie să introduci un ID de cerere.");
      return;
    }
    // aici vreau sa ma duc pe o pagina de genul /verifyrequeststatus?id=0020ca57-4bc0-4c6a-bc24-ba7ebb7c49b2
    // trebuie sa vad cum sa creez pagina, si ce endopoints sa creez.
    router.push(`/verifyrequest?id=${verifyIdInput.trim()}`);
  };

  const submitRequest = async () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !motivation.trim() ||
      !companyName.trim() ||
      !website.trim()
    ) {
      toast.error("Toate câmpurile marcate cu * sunt obligatorii.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Adresa de e-mail nu este validă.");
      return;
    }

    if (motivation.trim().length < 50) {
      toast.error("Motivația trebuie să aibă minim 50 de caractere.");
      return;
    }

    setLoading(true);
    try {
      const requestBody = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        companyName: companyName.trim(),
        website: website.trim(),
        motivation: motivation.trim(),
      };
      console.log("Frontend [TRIMITE]:", JSON.stringify(requestBody, null, 2));
      const res = await fetch("/api/dev-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json().catch(() => ({}));
      console.log("Frontend [PRIMEȘTE]:", {
        status: res.status,
        ok: res.ok,
        data: data,
      });
      if (!res.ok) {
        throw new Error(data?.error || "Eroare la trimiterea cererii");
      }

      const requestId = data.id;
      if (!requestId) {
        throw new Error("Serverul nu a returnat un ID pentru cerere.");
      }

      setSubmittedId(requestId);
      setDialogOpen(true);

      toast.success("Cererea a fost înregistrată cu succes!");
    } catch (error: any) {
      toast.error(error.message || "A apărut o eroare");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {" "}
      <Card className="lg:col-span-1 lg:col-start-2 justify-self-center w-[calc(65vw-3rem)] h-[calc(92vh-3rem)] p-6 flex flex-col">
        {" "}
        <CardHeader>
          <div className="h-full flex flex-col items-center justify-center text-center gap-2">
            <CardTitle className="text-lg">
              Formular de înscriere pentru dezvoltatori
            </CardTitle>
          </div>
        </CardHeader>
        <Separator className="!h-[1.5px]" />{" "}
        <CardContent className="flex-1 flex flex-col overflow-y-auto scrollbar-none ...">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prenume *</Label>
              <Input
                id="firstName"
                placeholder="ex: Ion"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nume *</Label>
              <Input
                id="lastName"
                placeholder="ex: Popescu"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Adresă de e-mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="ex: ion.popescu@companie.ro"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Numele companiei *</Label>
              <Input
                id="companyName"
                placeholder="ex: Compania SRL"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website *</Label>
              <Input
                id="website"
                placeholder="ex: https://websiteulmeu.ro"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivation">Motivația cererii *</Label>
              <Textarea
                id="motivation"
                value={motivation}
                onChange={(e) => {
                  setMotivation(e.target.value);
                  e.currentTarget.style.height = "auto";
                  e.currentTarget.style.height =
                    e.currentTarget.scrollHeight + "px";
                }}
                placeholder="Descrie pe scurt ce proiect dorești să construiești cu API-ul nostru..."
                className="w-full ... min-h-[100px]"
              />
              <div
                className={`text-sm mt-1 ${
                  motivation.trim().length < 50
                    ? "text-red-500"
                    : "text-green-600"
                }`}
              >
                {motivation.trim().length}/50 caractere minime
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Label
                htmlFor="mandatory"
                className="text-sm ... peer-disabled:opacity-100"
              >
                * indică un câmp obligatoriu.
              </Label>
            </div>
          </div>
        </CardContent>
        <Separator className="!h-[1.5px]" />
        <CardFooter className="justify-center">
          <Button
            onClick={submitRequest}
            disabled={loading}
            variant="success"
            size="sm"
            className="cursor-pointer"
          >
            {loading ? "Se trimite..." : "Trimite cererea"}
          </Button>
          <h1 className="px-2 text-sm">sau</h1>
          <Button
            onClick={verifyRequest}
            disabled={loading}
            variant="outline"
            size="sm"
            className="cursor-pointer"
          >
            Verifică o cerere
          </Button>
        </CardFooter>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-1 border-green-500 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600">
              Cerere înregistrată!
            </DialogTitle>
            <DialogDescription>
              Am înregistrat cererea ta. Vei primi un e-mail când aceasta este
              soluționată.
            </DialogDescription>
          </DialogHeader>

          {/* Secțiunea pentru copierea ID-ului */}
          <div className="space-y-2">
            <Label htmlFor="request-id" className="text-sm font-medium">
              Salvează acest ID pentru a verifica statusul cererii:
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="request-id"
                value={submittedId}
                readOnly
                className="flex-1"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="size-4 text-green-600" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              className="cursor-pointer"
              variant="secondary"
              onClick={() => {
                setDialogOpen(false);
                //router.push(`/verifyrequeststatus?id=${submittedId}`);
              }}
            >
              OK, am înțeles.
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verificare Status Cerere</DialogTitle>
            <DialogDescription>
              Introdu ID-ul pe care l-ai primit la înregistrarea cererii.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="request-id-verify" className="text-sm font-medium">
              ID Cerere
            </Label>
            <Input
              id="request-id-verify"
              value={verifyIdInput}
              onChange={(e) => setVerifyIdInput(e.target.value)}
              placeholder="ex: 29dj0qlx-dc03-4369-jaem-ab5de49laq10"
              disabled={verifyLoading}
            />
          </div>

          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                disabled={verifyLoading}
              >
                Anulează
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleVerifySubmit}
              disabled={verifyLoading}
            >
              {verifyLoading ? "Se verifică..." : "Verifică"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
