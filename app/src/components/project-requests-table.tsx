"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUpdateParams } from "@/hooks/useUpdateParams";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@radix-ui/react-separator";
import {
  ArrowDownZA,
  ArrowUpZA,
  CheckCircle2,
  Clock3,
  ClockArrowDown,
  ClockArrowUp,
  FilterX,
  XCircle,
} from "lucide-react";
import { canManageProjectRequests } from "@/lib/roles";
import {
  getProjectStatusLabel,
  getProjectStatusVariant,
} from "@/lib/project-status";

export type ProjectRequest = {
  id: number;
  name: string;
  created_by: string | null;
  status: string;
  created_at: string;
};

function tipText(key: "name" | "created_at", sort: string, order: string) {
  if (key === "name") {
    return sort === "name"
      ? order === "asc"
        ? "Nume proiect A-Z"
        : "Nume proiect Z-A"
      : "Sorteaza dupa numele proiectului";
  }

  return sort === "created_at"
    ? order === "asc"
      ? "Cele mai vechi"
      : "Cele mai recente"
    : "Sorteaza dupa data";
}

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

export default function ProjectRequestsTable({
  requests,
}: {
  requests: ProjectRequest[];
}) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const router = useRouter();
  const sp = useSearchParams();
  const update = useUpdateParams();

  const sort = (sp.get("sort") as "name" | "created_at") ?? "created_at";
  const order = (sp.get("order") as "asc" | "desc") ?? "desc";
  const statusFilter =
    (sp.get("status") as "pending" | "approved" | "rejected" | null) ?? null;

  if (!canManageProjectRequests(userRole)) {
    return null;
  }

  const hasData = requests && requests.length > 0;
  const hasFilters = Boolean(
    sp.get("status") || sp.get("sort") || sp.get("order"),
  );

  const toggleSort = (key: "name" | "created_at") => {
    const nextOrder = sort === key && order === "asc" ? "desc" : "asc";
    update({ sort: key, order: nextOrder }, "push");
  };

  const iconFor = (key: "name" | "created_at") => {
    const active = sort === key;
    const asc = order === "asc";

    if (key === "name") {
      return active ? (
        asc ? (
          <ArrowUpZA className="size-4" />
        ) : (
          <ArrowDownZA className="size-4" />
        )
      ) : (
        <ArrowUpZA className="size-4 opacity-30" />
      );
    }

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
      <Card className="app-panel overflow-hidden flex flex-col">
        <CardHeader>
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <CardTitle className="text-lg">
              Cereri de listare proiecte
            </CardTitle>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant={statusFilter === "pending" ? "secondary" : "outline"}
                size="sm"
                onClick={() => update({ status: "pending" }, "push")}
                className="cursor-pointer"
              >
                <Clock3 className="size-4" />
                Pending
              </Button>

              <Button
                variant={statusFilter === "approved" ? "secondary" : "outline"}
                size="sm"
                onClick={() => update({ status: "approved" }, "push")}
                className="cursor-pointer"
              >
                <CheckCircle2 className="size-4" />
                Approved
              </Button>

              <Button
                variant={statusFilter === "rejected" ? "secondary" : "outline"}
                size="sm"
                onClick={() => update({ status: "rejected" }, "push")}
                className="cursor-pointer"
              >
                <XCircle className="size-4" />
                Rejected
              </Button>

              {hasFilters && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() =>
                    update(
                      {
                        status: null,
                        sort: null,
                        order: null,
                      },
                      "push",
                    )
                  }
                >
                  <FilterX className="size-4" />
                  Sterge filtrele
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="flex-1 overflow-auto scrollbar-none ms-overflow-style-none [&::-webkit-scrollbar]:hidden">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>

                  <TableHead>
                    <button
                      type="button"
                      onClick={() => toggleSort("name")}
                      className="inline-flex items-center gap-1 cursor-pointer"
                    >
                      Proiect
                      <IconWithTip text={tipText("name", sort, order)}>
                        {iconFor("name")}
                      </IconWithTip>
                    </button>
                  </TableHead>

                  <TableHead>Dezvoltator</TableHead>
                  <TableHead className="w-[180px]">Status</TableHead>

                  <TableHead className="w-[190px]">
                    <button
                      type="button"
                      onClick={() => toggleSort("created_at")}
                      className="inline-flex items-center gap-1 cursor-pointer"
                    >
                      Creat la
                      <IconWithTip text={tipText("created_at", sort, order)}>
                        {iconFor("created_at")}
                      </IconWithTip>
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {!hasData ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground text-center py-24"
                    >
                      Nu am gasit nicio cerere.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow
                      key={req.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => router.push(`/projectrequests/${req.id}`)}
                    >
                      <TableCell className="font-medium">{req.id}</TableCell>
                      <TableCell>
                        <div
                          className="max-w-[50ch] truncate"
                          title={req.name}
                        >
                          {req.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="max-w-[30ch] truncate"
                          title={req.created_by ?? undefined}
                        >
                          {req.created_by ?? "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getProjectStatusVariant(req.status)}>
                          {getProjectStatusLabel(req.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(req.created_at).toLocaleString("ro-RO")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </CardContent>

        <CardFooter className="text-sm text-muted-foreground justify-center">
          Lista tuturor cererilor de listare proiecte.
        </CardFooter>
      </Card>
    </div>
  );
}
