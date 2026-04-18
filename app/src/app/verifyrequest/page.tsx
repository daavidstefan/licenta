"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

import { Button } from "@@/src/components/ui/button";

type InvitationData = {
  id: string;
  token: string;
  used: boolean;
  used_at: string | null;
  expires_at: string;
  created_at: string;
  registrationUrl: string;
};

type RequestData = {
  id: string;
  status: "pending" | "approved" | "rejected";
  firstname: string;
  lastname: string;
  email: string;
  companyname: string;
  website: string;
  motivation: string;
  review_reason: string | null;
  created_at: string;
  invitation: InvitationData | null;
};

function getStatusBadgeClasses(status: RequestData["status"]) {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-700 border-green-200";
    case "rejected":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }
}

function getStatusLabel(status: RequestData["status"]) {
  switch (status) {
    case "approved":
      return "Aprobată";
    case "rejected":
      return "Respinsă";
    default:
      return "În așteptare";
  }
}

export default function VerifyRequestPage() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("id");

  const [data, setData] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: session, status } = useSession();
  const userRole = session?.user?.role;

  if (!userRole || userRole === "client") {
    redirect("/forbidden");
  }

  useEffect(() => {
    if (!requestId) {
      setError("ID-ul cererii lipsește din URL.");
      setLoading(false);
      return;
    }

    const fetchRequest = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/verify-request/${requestId}`);
        const result = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(result?.error || "Nu am putut verifica cererea.");
        }

        setData(result);
      } catch (err: any) {
        setError(err.message || "A apărut o eroare.");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  const invitationExists = !!data?.invitation;
  const invitationUsed = data?.invitation?.used === true;

  const invitationExpired = useMemo(() => {
    if (!data?.invitation?.expires_at) return false;
    return new Date(data.invitation.expires_at).getTime() <= Date.now();
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl border bg-white p-8 shadow-sm text-center">
          <p className="text-sm text-muted-foreground">
            Se încarcă statusul cererii...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl border bg-white p-8 shadow-sm text-center">
          <h1 className="text-2xl font-semibold mb-4">Verificare cerere</h1>
          <p className="text-sm text-red-600">{error}</p>

          <div className="mt-6">
            <Button asChild variant="outline" className="cursor-pointer">
              <Link href="/devregister">Înapoi</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl border bg-white p-8 shadow-sm text-center">
          <h1 className="text-2xl font-semibold mb-4">Verificare cerere</h1>
          <p className="text-sm text-muted-foreground">
            Cererea nu a fost găsită.
          </p>

          <div className="mt-6">
            <Button asChild variant="outline" className="cursor-pointer">
              <Link href="/devregister">Înapoi</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Detalii cerere</h1>
          </div>

          <span
            className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-medium ${getStatusBadgeClasses(
              data.status,
            )}`}
          >
            {getStatusLabel(data.status)}
          </span>
        </div>

        <div className="mt-6 grid gap-5">
          <div>
            <p className="text-sm text-muted-foreground">ID cerere</p>
            <p className="mt-1 break-all font-medium">{data.id}</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Prenume</p>
              <p className="mt-1 font-medium">{data.firstname}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Nume</p>
              <p className="mt-1 font-medium">{data.lastname}</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">E-mail</p>
              <p className="mt-1 break-all font-medium">{data.email}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Creată la</p>
              <p className="mt-1 font-medium">
                {new Date(data.created_at).toLocaleString("ro-RO")}
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Companie</p>
              <p className="mt-1 font-medium">{data.companyname}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Website</p>
              <p className="mt-1 break-all font-medium">{data.website}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Motivația cererii</p>
            <div className="mt-2 rounded-md border p-4 whitespace-pre-wrap break-words">
              {data.motivation}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6">
          {data.status === "pending" && (
            <div className="space-y-3">
              <p className="text-sm text-yellow-700">
                Cererea ta este încă în așteptare.
              </p>
            </div>
          )}

          {data.status === "rejected" && (
            <div className="space-y-3">
              {data.review_reason && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-700">
                    Motivul respingerii
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-red-700">
                    {data.review_reason}
                  </p>
                </div>
              )}
            </div>
          )}

          {data.status === "approved" &&
            invitationExists &&
            !invitationUsed &&
            !invitationExpired && (
              <div className="space-y-3 flex flex-col items-center text-center">
                <p className="text-sm font-medium text-green-700">
                  Cererea ta a fost aprobată. Îți poți crea acum contul de
                  dezvoltator.
                </p>

                <Button asChild variant="success" className="cursor-pointer">
                  <Link href={data.invitation!.registrationUrl}>
                    Creează contul de dezvoltator
                  </Link>
                </Button>
              </div>
            )}

          {data.status === "approved" && invitationExists && invitationUsed && (
            <div className="space-y-3 flex flex-col items-center text-center">
              <p className="text-sm font-medium text-green-700">
                Ai deja un cont activ.
              </p>

              <Button asChild variant="success" className="cursor-pointer">
                <Link href="/login">Conectează-te</Link>
              </Button>
            </div>
          )}

          {data.status === "approved" &&
            invitationExists &&
            !invitationUsed &&
            invitationExpired && (
              <div className="space-y-3">
                <p className="text-sm text-amber-700">
                  Cererea a fost aprobată, dar linkul de activare a expirat.
                </p>
              </div>
            )}

          {data.status === "approved" && !invitationExists && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Cererea este aprobată, dar invitația de activare nu este
                disponibilă momentan.
              </p>
            </div>
          )}
        </div>

        <div className="mt-3 flex justify-center">
          <Button asChild variant="outline" className="cursor-pointer">
            <Link href="/">Înapoi</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
