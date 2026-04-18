import { getServerSession } from "next-auth";
import { authOptions } from "@@/lib/auth";
import { pg } from "@@/lib/db";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DevRequestActions from "@/components/dev-requests-actions";
import { redirect } from "next/navigation";
import { canManageDevRequests } from "@/lib/roles";

type DevRequestRow = {
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

export default async function DevRequestDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!canManageDevRequests(userRole)) {
    redirect("/forbidden");
  }

  const { rows } = await pg.query<DevRequestRow>(
    `
      SELECT
        id,
        firstname,
        lastname,
        email,
        companyname,
        website,
        motivation,
        status,
        created_at
      FROM dev_requests
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  const request = rows[0];

  if (!request) {
    return (
      <div className="p-6">
        <Card className="lg:col-span-1 lg:col-start-2 justify-self-center w-[calc(65vw-3rem)] h-[calc(92vh-3rem)] overflow-y-auto p-6 flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg text-center">
              Cerere inexistentă
            </CardTitle>
          </CardHeader>

          <Separator />

          <CardContent className="flex-1 flex items-center justify-center">
            <p>Nu există nicio cerere cu ID-ul acesta.</p>
          </CardContent>

          <CardFooter className="text-sm text-muted-foreground justify-center">
            Verifică linkul și încearcă din nou.
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isPending = request.status?.trim().toLowerCase() === "pending";

  return (
    <div className="p-6">
      <Card className="lg:col-span-1 lg:col-start-2 justify-self-center w-[calc(65vw-3rem)] h-[calc(92vh-3rem)] overflow-y-auto p-6 flex flex-col">
        <CardHeader>
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <CardTitle className="text-lg">
              Detalii cerere dezvoltator
            </CardTitle>
            <p className="text-sm text-muted-foreground break-all">
              ID: {request.id}
            </p>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="flex-1 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Prenume</p>
              <p className="font-medium">{request.firstname}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Nume</p>
              <p className="font-medium">{request.lastname}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium break-all">{request.email}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Companie</p>
              <p className="font-medium">{request.companyname}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Website</p>
              <a
                href={request.website}
                target="_blank"
                rel="noreferrer"
                className="font-medium underline break-all"
              >
                {request.website}
              </a>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={getStatusVariant(request.status)}>
                {getStatusLabel(request.status)}
              </Badge>
            </div>

            <div className="space-y-1 md:col-span-2">
              <p className="text-sm text-muted-foreground">Creat la</p>
              <p className="font-medium">
                {new Date(request.created_at).toLocaleString("ro-RO")}
              </p>
            </div>

            <div className="space-y-1 md:col-span-2">
              <p className="text-sm text-muted-foreground">Motivație</p>
              <div className="rounded-md border p-4 whitespace-pre-wrap break-words">
                {request.motivation}
              </div>
            </div>
          </div>
        </CardContent>

        {isPending && (
          <CardFooter className="flex flex-col gap-3">
            <DevRequestActions id={request.id} currentStatus={request.status} />

            {/* <div className="text-sm text-muted-foreground text-center">
            Acțiuni disponibile pentru cererea selectată.
          </div> */}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
