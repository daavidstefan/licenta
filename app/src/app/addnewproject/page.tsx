// pagina pentru adaugarea unui proiect nou

"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

interface Feature {
  key: string;
  label: string;
}

export default function AddNewProject() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [features, setFeatures] = useState<Feature[]>([]);
  const [featInput, setFeatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const featRef = useRef<HTMLTextAreaElement>(null);

  const addFeature = () => {
    const label = featInput.trim();
    if (!label) return;

    if (features.some((f) => f.label.toLowerCase() === label.toLowerCase())) {
      setFeatInput("");
      featRef.current?.focus();
      return;
    }

    // genereaza un key unic pentru feature
    const key =
      label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now().toString(36);

    setFeatures((prev) => [...prev, { key, label }]);
    setFeatInput("");
    featRef.current?.focus();
  };

  const removeFeature = (key: string) =>
    setFeatures((prev) => prev.filter((f) => f.key !== key));

  const pushToDatabase = async () => {
    if (!name.trim()) {
      toast.error("Titlul proiectului este obligatoriu");
      return;
    }

    if (name.trim().length < 10) {
      toast.error("Titlul trebuie să aibă minim 10 caractere");
      return;
    }

    if (details.trim().length < 50) {
      toast.error("Descrierea trebuie să aibă minim 50 de caractere");
      return;
    }

    if (features.length === 0) {
      toast.error("Trebuie să adaugi cel puțin un serviciu");
      return;
    }

    // trimite datele catre server
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          details: details.trim() || null,
          features: features.map((f) => ({ key: f.key, label: f.label })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Eroare la salvare");
      }
      toast.success("Proiect adăugat");
      router.push("/listofprojects");
      setName("");
      setDetails("");
      setFeatures([]);
      setFeatInput("");
    } catch (error: any) {
      toast.error(error.message || "A apărut o eroare");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card className="lg:col-span-1 lg:col-start-2 justify-self-center w-[calc(65vw-3rem)] h-[calc(92vh-3rem)] p-6 flex flex-col">
        {" "}
        <CardHeader>
          <div className="h-full flex flex-col items-center justify-center text-center gap-2">
            <CardTitle className="text-lg">Adaugă un proiect nou</CardTitle>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="flex-1 flex flex-col overflow-y-auto scrollbar-none ms-overflow-style-none [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_bottom,transparent_0%,black_0.5rem,black_calc(100%_-_0.5rem),transparent_100%)]">
          {" "}
          <div className="p-2">
            <Textarea
              rows={1}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                e.currentTarget.style.height = "auto";
                e.currentTarget.style.height =
                  e.currentTarget.scrollHeight + "px";
              }}
              placeholder="Introdu titlul proiectului..."
              className="w-full rounded-md border px-3 py-2 text-sm outline-none resize-none overflow-hidden"
            />
            <div
              className={`text-sm mt-1 ${
                name.trim().length < 10 ? "text-red-500" : "text-green-600"
              }`}
            >
              {name.trim().length}/10 caractere
            </div>
          </div>
          <div className="p-2">
            <Textarea
              value={details}
              onChange={(e) => {
                setDetails(e.target.value);

                e.currentTarget.style.height = "auto";
                e.currentTarget.style.height =
                  e.currentTarget.scrollHeight + "px";
              }}
              placeholder="Adaugă o descriere..."
              className="w-full rounded-md border px-3 py-2 text-sm outline-none resize-none overflow-hidden"
            />
            <div
              className={`text-sm mt-1 ${
                details.length < 50 ? "text-red-500" : "text-green-600"
              }`}
            >
              {details.length}/50 caractere
            </div>
          </div>
          <div className="p-2 flex items-center gap-2">
            <Textarea
              ref={featRef}
              rows={1}
              value={featInput}
              onChange={(e) => {
                setFeatInput(e.target.value);
                e.currentTarget.style.height = "auto";
                e.currentTarget.style.height =
                  e.currentTarget.scrollHeight + "px";
              }}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addFeature())
              }
              placeholder="Adaugă un serviciu..."
              className="flex-1 rounded-md border px-3 py-2 text-sm outline-none resize-none overflow-hidden"
            />
          </div>
          <div className="flex justify-center my-2">
            <Button onClick={addFeature} size="sm">
              Adaugă
            </Button>
          </div>
          <div className="p-2">
            <Card>
              <CardTitle className="text-center">Lista servicii</CardTitle>
              <div className="p-2">
                {features.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">
                    Niciun feature adăugat încă.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {features.map((f) => (
                      <Badge
                        key={f.key}
                        variant="outline"
                        className="inline-flex items-center gap-1 text-muted-foreground pl-2 pr-1 min-w-0 whitespace-normal h-auto"
                      >
                        <span className="min-w-0 break-all whitespace-normal">
                          {f.label}
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => removeFeature(f.key)}
                                className="ml-1 rounded p-0.5 hover:bg-muted cursor-pointer"
                                aria-label={`Elimină ${f.label}`}
                              >
                                <X className="size-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Șterge</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </CardContent>
        <Separator className="!h-[1.5px]" />
        <CardFooter className="justify-center">
          <Button
            onClick={pushToDatabase}
            disabled={loading}
            variant="success"
            size="sm"
            className="cursor-pointer"
          >
            {loading ? "Se salvează..." : "Adaugă proiectul"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
