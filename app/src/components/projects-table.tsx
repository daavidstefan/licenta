// tabel cu toate proiectele
// primeste props de la \listofprojects\page.tsx
// realizeaza sortarea
// populeaza tabelul de proiecte

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUpdateParams } from "@/hooks/useUpdateParams";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TableButton } from "./table-button";
import { Input } from "@/components/ui/input";

import {
  ArrowUp10,
  ArrowDown10,
  ArrowUpZA,
  ArrowDownZA,
  ClockArrowUp,
  ClockArrowDown,
  FilterX,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Separator } from "@radix-ui/react-separator";

import { useSession } from "next-auth/react";
import { canCreateProjects } from "@/lib/roles";

type Project = {
  id: number;
  name: string;
  details: string;
  slug: string;
  created_at: string | Date | null;
  created_by: string | null;
};

// formatarea datei
const fmtDate = (v: string | Date | null) => {
  if (!v) return "-";
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? "-" : d.toLocaleString();
};

// determina textul pentru tooltip
const tipText = (
  key: "id" | "name" | "created_at",
  sort: string,
  order: string,
) => {
  if (key === "id")
    return sort === "id"
      ? order === "asc"
        ? "ID crescător"
        : "ID descrescător"
      : "Sortează după ID";
  if (key === "name")
    return sort === "name"
      ? order === "asc"
        ? "Nume A→Z"
        : "Nume Z→A"
      : "Sortează după nume";
  return sort === "created_at"
    ? order === "asc"
      ? "Cele mai vechi"
      : "Cele mai recente"
    : "Sortează după dată";
};

const IconWithTip = ({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="inline-flex cursor-pointer">{children}</span>
    </TooltipTrigger>
    <TooltipContent side="top">{text}</TooltipContent>
  </Tooltip>
);

export default function ProjectsTable({ projects }: { projects: Project[] }) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const canCreateProject = canCreateProjects(userRole);

  const sp = useSearchParams();
  const update = useUpdateParams();

  const sort = (sp.get("sort") as "id" | "name" | "created_at") ?? "id";
  const order = (sp.get("order") as "asc" | "desc") ?? "asc";

  const nameQ = sp.get("name") ?? "";
  const authorQ = sp.get("author") ?? "";

  const [localName, setLocalName] = useState(nameQ);
  const [localAuthor, setLocalAuthor] = useState(authorQ);

  const hasFilters = Boolean(
    sp.get("name") || sp.get("author") || sp.get("sort") || sp.get("order"),
  );

  // comuta sortarea
  const toggleSort = (key: "id" | "name" | "created_at") => {
    const nextOrder = sort === key && order === "asc" ? "desc" : "asc";
    update({ sort: key, order: nextOrder }, "push");
  };

  // modifica icon-urile in functie de filtare
  const iconFor = (key: "id" | "name" | "created_at") => {
    const active = sort === key;
    const asc = order === "asc";
    if (key === "id")
      return active ? (
        asc ? (
          <ArrowUp10 className="size-4" />
        ) : (
          <ArrowDown10 className="size-4" />
        )
      ) : (
        <ArrowUp10 className="size-4 opacity-30" />
      );
    if (key === "name")
      return active ? (
        asc ? (
          <ArrowUpZA className="size-4" />
        ) : (
          <ArrowDownZA className="size-4" />
        )
      ) : (
        <ArrowUpZA className="size-4 opacity-30" />
      );
    return active ? (
      asc ? (
        <ClockArrowUp className="size-4" />
      ) : (
        <ClockArrowDown className="size-4" />
      )
    ) : (
      <ClockArrowUp className="size-4 opacity-30" />
    );
  };

  return (
    <div className="app-page">
      <Card className="app-panel flex flex-col">
        <CardHeader className="px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col shrink-0">
              <CardTitle className="text-lg">
                Lista proiectelor disponibile
              </CardTitle>
              {canCreateProject && (
                <Link
                  href="/addnewproject"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Adaugă un proiect nou
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="Caută după nume…"
                className="w-[200px] rounded-md border px-3 py-2 text-sm outline-none"
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  update(
                    { name: localName || null, author: localAuthor || null },
                    "push",
                  )
                }
              />
              <Input
                value={localAuthor}
                onChange={(e) => setLocalAuthor(e.target.value)}
                placeholder="Caută după autor…"
                className="w-[200px] min-w-0 rounded-md border px-3 py-2 text-sm outline-none"
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  update(
                    { name: localName || null, author: localAuthor || null },
                    "push",
                  )
                }
              />
              <Button
                onClick={() =>
                  update(
                    { name: localName || null, author: localAuthor || null },
                    "push",
                  )
                }
                variant="outline"
                size="sm"
              >
                Căutare
              </Button>
              <Button
                disabled={!hasFilters}
                onClick={() => {
                  setLocalName("");
                  setLocalAuthor("");
                  update(
                    { name: null, author: null, sort: null, order: null },
                    "push",
                  );
                }}
                variant="destructive"
                className="cursor-pointer"
                size="sm"
              >
                <FilterX className="size-4" />
                Șterge filtrele
              </Button>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="flex-1 flex flex-col overflow-y-auto scrollbar-none ms-overflow-style-none [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_bottom,transparent_0%,black_1.5rem,black_calc(100%_-_1.5rem),transparent_100%)]">
          <TooltipProvider delayDuration={200}>
            <div className="p-6">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] text-left">
                      <button
                        type="button"
                        onClick={() => toggleSort("id")}
                        className="inline-flex items-center gap-1"
                      >
                        ID
                        <IconWithTip text={tipText("id", sort, order)}>
                          {iconFor("id")}
                        </IconWithTip>
                      </button>
                    </TableHead>
                    <TableHead className="text-left">
                      <button
                        type="button"
                        onClick={() => toggleSort("name")}
                        className="inline-flex items-center gap-1"
                      >
                        Proiect
                        <IconWithTip text={tipText("name", sort, order)}>
                          {iconFor("name")}
                        </IconWithTip>
                      </button>
                    </TableHead>
                    <TableHead className="w-[200px] text-left">Autor</TableHead>
                    <TableHead className="w-[220px] text-left">
                      <button
                        type="button"
                        onClick={() => toggleSort("created_at")}
                        className="inline-flex items-center gap-1"
                      >
                        Creat
                        <IconWithTip text={tipText("created_at", sort, order)}>
                          {iconFor("created_at")}
                        </IconWithTip>
                      </button>
                    </TableHead>
                    <TableHead className="w-[120px] text-right">
                      Detalii
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {projects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-left">{p.id}</TableCell>
                      <TableCell className="text-left">
                        <div className="truncate max-w-[35ch]">{p.name}</div>
                      </TableCell>
                      <TableCell className="text-left">
                        {p.created_by}
                      </TableCell>
                      <TableCell className="text-left">
                        {fmtDate(p.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <TableButton slug={p.slug} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {projects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        Niciun rezultat.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}
