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
  ArrowUpZA,
  ArrowDownZA,
  ClockArrowUp,
  ClockArrowDown,
  CheckCircle2,
  XCircle,
  Clock3,
  FilterX,
} from "lucide-react";

export type DevRequest = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  companyname: string;
  website: string;
  motivation: string;
  status: string;
  created_at: string;
};

function formatShortId(id: string) {
  return `${id.slice(0, 5)}...`;
}

function getStatusVariant(
  status: string,
): "warning" | "success" | "destructive" | "secondary" {
  switch (status.toLowerCase()) {
    case "pending":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
      return "destructive";
    default:
      return "secondary";
  }
}

function getStatusLabel(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

function tipText(
  key: "companyname" | "created_at",
  sort: string,
  order: string,
) {
  if (key === "companyname") {
    return sort === "companyname"
      ? order === "asc"
        ? "Nume companie A→Z"
        : "Nume companie Z→A"
      : "Sortează după numele companiei";
  }

  return sort === "created_at"
    ? order === "asc"
      ? "Cele mai vechi"
      : "Cele mai recente"
    : "Sortează după dată";
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

export default function DevRequestsTable({
  requests,
}: {
  requests: DevRequest[];
}) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const router = useRouter();

  const sp = useSearchParams();
  const update = useUpdateParams();

  const sort = (sp.get("sort") as "companyname" | "created_at") ?? "created_at";
  const order = (sp.get("order") as "asc" | "desc") ?? "desc";
  const statusFilter =
    (sp.get("status") as "pending" | "approved" | "rejected" | null) ?? null;

  if (userRole !== "admin") {
    return null;
  }

  const hasData = requests && requests.length > 0;
  const hasFilters = Boolean(
    sp.get("status") || sp.get("sort") || sp.get("order"),
  );

  const toggleSort = (key: "companyname" | "created_at") => {
    const nextOrder = sort === key && order === "asc" ? "desc" : "asc";
    update({ sort: key, order: nextOrder }, "push");
  };

  const iconFor = (key: "companyname" | "created_at") => {
    const active = sort === key;
    const asc = order === "asc";

    if (key === "companyname") {
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
      <Card className="app-panel overflow-y-auto flex flex-col">
        <CardHeader>
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <CardTitle className="text-lg">
              Cereri de înregistrare dezvoltatori
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
                  Șterge filtrele
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="flex-1 overflow-x-auto scrollbar-none">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">ID</TableHead>

                  <TableHead>
                    <button
                      type="button"
                      onClick={() => toggleSort("companyname")}
                      className="inline-flex items-center gap-1 cursor-pointer"
                    >
                      Nume companie
                      <IconWithTip text={tipText("companyname", sort, order)}>
                        {iconFor("companyname")}
                      </IconWithTip>
                    </button>
                  </TableHead>

                  <TableHead className="w-[140px]">Status</TableHead>

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
                      colSpan={4}
                      className="text-muted-foreground text-center py-24"
                    >
                      Nu am găsit nicio cerere.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow
                      key={req.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => router.push(`/devrequests/${req.id}`)}
                    >
                      <TableCell className="font-medium">
                        {formatShortId(req.id)}
                      </TableCell>

                      <TableCell>{req.companyname}</TableCell>

                      <TableCell>
                        <Badge variant={getStatusVariant(req.status)}>
                          {getStatusLabel(req.status)}
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
          Lista tuturor cererilor de înregistrare.
        </CardFooter>
      </Card>
    </div>
  );
}
