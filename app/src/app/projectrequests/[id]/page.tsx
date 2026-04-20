import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
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
import ProjectRequestActions from "@/components/project-request-actions";
import { canManageProjectRequests } from "@/lib/roles";
import {
  getProjectStatusLabel,
  getProjectStatusVariant,
} from "@/lib/project-status";

type ProjectRequestDetails = {
  id: number;
  slug: string;
  name: string;
  details: string | null;
  created_by: string | null;
  author_sub_id: string | null;
  author_email: string | null;
  author_username: string | null;
  status: string;
  review_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type FeatureRow = {
  id: number;
  label: string;
  key: string | null;
};

export default async function ProjectRequestDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!canManageProjectRequests(userRole)) {
    redirect("/forbidden");
  }

  const projectId = Number(id);
  if (!Number.isInteger(projectId)) {
    redirect("/projectrequests");
  }

  const { rows } = await pg.query<ProjectRequestDetails>(
    `
      SELECT
        p.id,
        p.slug,
        p.name,
        p.details,
        p.created_by,
        p.author_sub_id,
        p.status,
        p.review_reason,
        p.reviewed_at,
        p.created_at,
        u.email AS author_email,
        u.username AS author_username
      FROM projects p
      LEFT JOIN users u
        ON u.id = p.author_sub_id
      WHERE p.id = $1
      LIMIT 1
    `,
    [projectId],
  );

  const project = rows[0];

  if (!project) {
    return (
      <div className="app-page">
        <Card className="app-panel overflow-y-auto flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg text-center">
              Cerere inexistenta
            </CardTitle>
          </CardHeader>

          <Separator />

          <CardContent className="flex-1 flex items-center justify-center">
            <p>Nu exista nicio cerere de proiect cu ID-ul acesta.</p>
          </CardContent>

          <CardFooter className="text-sm text-muted-foreground justify-center">
            Verifica linkul si incearca din nou.
          </CardFooter>
        </Card>
      </div>
    );
  }

  const { rows: features } = await pg.query<FeatureRow>(
    `
      SELECT id, feature_key AS key, label
      FROM features
      WHERE project_id = $1
      ORDER BY label
    `,
    [project.id],
  );

  const isPending = project.status.trim().toLowerCase() === "pending";

  return (
    <div className="app-page">
      <Card className="app-panel overflow-y-auto flex flex-col">
        <CardHeader>
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <CardTitle className="text-lg">Cerere listare proiect</CardTitle>
            <p className="text-sm text-muted-foreground break-all">
              ID: {project.id}
            </p>
            <Badge variant={getProjectStatusVariant(project.status)}>
              {getProjectStatusLabel(project.status)}
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="flex-1 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Proiect</p>
              <p className="font-medium">{project.name}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Dezvoltator</p>
              <p className="font-medium">{project.created_by ?? "-"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium break-all">
                {project.author_email ?? "-"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Creat la</p>
              <p className="font-medium">
                {new Date(project.created_at).toLocaleString("ro-RO")}
              </p>
            </div>

            <div className="space-y-1 md:col-span-2">
              <p className="text-sm text-muted-foreground">Descriere</p>
              <div className="rounded-md border p-4 whitespace-pre-wrap break-words">
                {project.details || "-"}
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <p className="text-sm text-muted-foreground">Servicii</p>
              <div className="rounded-md border p-4">
                {features.length === 0 ? (
                  <span className="text-sm text-muted-foreground">-</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature) => (
                      <Badge key={feature.id} variant="outline">
                        {feature.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {project.review_reason && (
              <div className="space-y-1 md:col-span-2">
                <p className="text-sm text-muted-foreground">
                  Motiv respingere
                </p>
                <div className="rounded-md border border-red-200 bg-red-50 p-4 whitespace-pre-wrap break-words text-red-700">
                  {project.review_reason}
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <ProjectRequestActions
            id={project.id}
            currentStatus={project.status}
          />

          {!isPending && (
            <div className="text-sm text-muted-foreground text-center">
              Aceasta cerere a fost deja evaluata.
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
