"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type ValidationResponse = {
  valid: true;
  invitation: {
    id: string;
    token: string;
    email: string;
    expires_at: string;
    created_at: string;
  };
  request: {
    id: string;
    firstname: string;
    lastname: string;
    companyname: string;
    website: string;
    motivation: string;
    status: string;
  };
};

export default function CompleteDevRegistrationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = useMemo(
    () => searchParams.get("token")?.trim() ?? "",
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ValidationResponse | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Tokenul lipsește din URL.");
      setLoading(false);
      return;
    }

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/dev-invitations/validate?token=${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );

        const result = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(result?.error || "Invitația nu a putut fi validată.");
        }

        setData(result);
      } catch (err: any) {
        setError(err.message || "A apărut o eroare.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token]);

  const handleSubmit = async () => {
    if (!token) {
      toast.error("Token lipsă.");
      return;
    }

    if (!username.trim()) {
      toast.error("Username-ul este obligatoriu.");
      return;
    }

    if (username.trim().length < 3) {
      toast.error("Username-ul trebuie să aibă minimum 3 caractere.");
      return;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(username.trim())) {
      toast.error(
        "Username-ul poate conține doar litere, cifre, punct, underscore și minus.",
      );
      return;
    }

    if (!password) {
      toast.error("Parola este obligatorie.");
      return;
    }

    if (password.length < 8) {
      toast.error("Parola trebuie să aibă minimum 8 caractere.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Parolele nu coincid.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/dev-invitations/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          username: username.trim(),
          password,
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result?.error || "Nu am putut crea contul.");
      }

      toast.success("Contul de developer a fost creat cu succes.");
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message || "A apărut o eroare.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl p-6">
          <CardHeader>
            <CardTitle className="text-center">
              Se verifică invitația...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl p-6">
          <CardHeader>
            <CardTitle className="text-center">Invitație invalidă</CardTitle>
          </CardHeader>
          <Separator className="my-4" />
          <CardContent className="text-center text-sm text-muted-foreground">
            {error || "Invitația nu este validă."}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-6">
        <CardHeader>
          <div className="text-center space-y-2">
            <CardTitle>Finalizează înregistrarea ca developer</CardTitle>
            <p className="text-sm text-muted-foreground">
              Completează datele de autentificare pentru contul tău.
            </p>
          </div>
        </CardHeader>

        <Separator className="my-4" />

        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Prenume</p>
              <p className="font-medium">{data.request.firstname}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Nume</p>
              <p className="font-medium">{data.request.lastname}</p>
            </div>

            <div className="space-y-1 md:col-span-2">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium break-all">{data.invitation.email}</p>
            </div>

            <div className="space-y-1 md:col-span-2">
              <p className="text-sm text-muted-foreground">Companie</p>
              <p className="font-medium">{data.request.companyname}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="ex: developer.test"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Parolă</Label>
            <Input
              id="password"
              type="password"
              placeholder="Introdu parola"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmă parola</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Reintrodu parola"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting}
            />
          </div>
        </CardContent>

        <Separator className="my-4" />

        <CardFooter className="justify-center">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            variant="success"
            className="cursor-pointer"
          >
            {submitting ? "Se creează contul..." : "Creează contul"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
