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
import {
  getProjectStatusLabel,
  getProjectStatusVariant,
} from "@/lib/project-status";

type SearchParams = Promise<{
  id?: string;
}>;

type ProjectReviewDetails = {
  id: number;
  name: string;
  details: string | null;
  status: string;
  review_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  author_sub_id: string | null;
};

export default async function VerifyProjectPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getServerSession(authOptions);
  const userSub = (session?.user as any)?.id || (session?.user as any)?.sub;

  if (!userSub) {
    redirect("/login");
  }

  const sp = await searchParams;
  const projectId = Number(sp.id);

  if (!Number.isInteger(projectId)) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl p-6">
          <CardHeader>
            <CardTitle className="text-center">Verificare proiect</CardTitle>
          </CardHeader>
          <Separator className="my-4" />
          <CardContent className="text-center text-sm text-muted-foreground">
            ID-ul proiectului lipseste din URL.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { rows } = await pg.query<ProjectReviewDetails>(
    `
      SELECT
        id,
        name,
        details,
        status,
        review_reason,
        reviewed_at,
        created_at,
        author_sub_id
      FROM projects
      WHERE id = $1
      LIMIT 1
    `,
    [projectId],
  );

  const project = rows[0];

  if (!project) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl p-6">
          <CardHeader>
            <CardTitle className="text-center">Proiect inexistent</CardTitle>
          </CardHeader>
          <Separator className="my-4" />
          <CardContent className="text-center text-sm text-muted-foreground">
            Nu am gasit niciun proiect cu acest ID.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (project.author_sub_id !== userSub) {
    redirect("/forbidden");
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-6">
        <CardHeader>
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <CardTitle>Verificare proiect</CardTitle>
            <Badge variant={getProjectStatusVariant(project.status)}>
              {getProjectStatusLabel(project.status)}
            </Badge>
          </div>
        </CardHeader>

        <Separator className="my-4" />

        <CardContent className="space-y-5">
          <div>
            <p className="text-sm text-muted-foreground">Proiect</p>
            <p className="mt-1 font-medium">{project.name}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Trimis la</p>
            <p className="mt-1 font-medium">
              {new Date(project.created_at).toLocaleString("ro-RO")}
            </p>
          </div>

          {project.status === "rejected" && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">
                Motivul respingerii
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-red-700">
                {project.review_reason || "Nu a fost specificat un motiv."}
              </p>
            </div>
          )}

          {project.status === "approved" && (
            <p className="text-sm text-green-700">
              Proiectul tau a fost aprobat si este vizibil in lista proiectelor.
            </p>
          )}

          {project.status === "pending" && (
            <p className="text-sm text-muted-foreground">
              Proiectul tau este inca in curs de aprobare.
            </p>
          )}
        </CardContent>

        <CardFooter className="text-sm text-muted-foreground justify-center">
          Statusul cererii de listare.
        </CardFooter>
      </Card>
    </div>
  );
}
