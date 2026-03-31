"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type RequestData = {
  id: string;
  status: "pending" | "approved" | "rejected";
  firstname: string;
  lastname: string;
  email: string;
  companyname: string;
  motivation: string;
  created_at: string;
};

export default function VerifyRequestPage() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("id");

  const [data, setData] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Nu am putut verifica cererea.");
        }

        setData(result);
      } catch (err: any) {
        setError(err.message || "A apărut o eroare.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p>Se încarcă...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p>Cererea nu a fost găsită.</p>
      </div>
    );
  }

  const statusColor =
    data.status === "approved"
      ? "bg-green-100 text-green-700 border-green-200"
      : data.status === "rejected"
        ? "bg-red-100 text-red-700 border-red-200"
        : "bg-yellow-100 text-yellow-700 border-yellow-200";

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b pb-4">
          <h1 className="text-2xl font-semibold">Detalii cerere</h1>

          <span
            className={
              "inline-flex rounded-full border px-4 py-2 text-sm font-medium " +
              (data.status === "approved"
                ? "bg-green-100 text-green-700 border-green-200"
                : data.status === "rejected"
                  ? "bg-red-100 text-red-700 border-red-200"
                  : "bg-yellow-100 text-yellow-700 border-yellow-200")
            }
          >
            {data.status}
          </span>
        </div>

        <div className="mt-6 space-y-4 text-sm">
          <div>
            <p className="text-muted-foreground">ID cerere</p>
            <p className="break-all font-medium">{data.id}</p>
          </div>

          <div>
            <p className="text-muted-foreground">Nume și prenume</p>
            <p className="font-medium">
              {data.firstname} {data.lastname}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">E-mail</p>
            <p className="font-medium break-all">{data.email}</p>
          </div>

          <div>
            <p className="text-muted-foreground">Companie</p>
            <p className="font-medium">{data.companyname}</p>
          </div>

          <div>
            <p className="text-muted-foreground">Creată la</p>
            <p className="font-medium">
              {new Date(data.created_at).toLocaleString("ro-RO")}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">Motivația cererii</p>
            <p className="whitespace-pre-wrap leading-6">{data.motivation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
