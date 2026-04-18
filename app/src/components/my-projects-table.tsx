// tabel pentru proiectele mele

"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  getProjectStatusLabel,
  getProjectStatusVariant,
} from "@/lib/project-status";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@radix-ui/react-separator";

type Project = {
  id: number;
  name: string;
  created_at: string;
  slug: string;
  status: string;
};

export default function MyProjectsTable({ projects }: { projects: Project[] }) {
  const hasData = projects && projects.length > 0;
  const router = useRouter();

  // dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [target, setTarget] = useState<{ slug: string; name: string } | null>(
    null,
  );

  const openDelete = (slug: string, name: string) => {
    setTarget({ slug, name });
    setConfirmOpen(true);
  };

  const openRejectedProject = (project: Project) => {
    if (project.status === "rejected") {
      router.push(`/verifyproject?id=${project.id}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!target?.slug) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/projects/${target.slug}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Proiect șters");
      router.refresh();
    } catch {
      toast.error("Nu am putut șterge proiectul");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setTarget(null);
    }
  };

  return (
    <div className="p-6">
      <Card className="lg:col-span-1 lg:col-start-2 justify-self-center w-[calc(65vw-3rem)] h-[calc(92vh-3rem)] overflow-y-auto p-6 flex flex-col">
        <CardHeader>
          <div className="h-full flex flex-col items-center justify-center text-center gap-2">
            <CardTitle className="text-lg">Proiectele mele</CardTitle>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="flex-1">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Denumire</TableHead>

                <TableHead className="w-[190px]">Status</TableHead>
                <TableHead className="w-[180px]">Creat la</TableHead>
                <TableHead className="w-[120px] text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!hasData ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground text-center py-24"
                  >
                    Nu ai proiecte încă...
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((p) => (
                  <TableRow
                    key={p.id}
                    className={
                      p.status === "rejected"
                        ? "cursor-pointer hover:bg-accent/50"
                        : undefined
                    }
                    onClick={() => openRejectedProject(p)}
                  >
                    <TableCell className="font-medium">
                      <div className="truncate max-w-[55ch]">{p.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getProjectStatusVariant(p.status)}>
                        {getProjectStatusLabel(p.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(p.created_at).toLocaleString("ro-RO")}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Link
                        href={`/projects/${p.slug}`}
                        aria-label="Editează"
                        className="inline-flex p-2 rounded-md hover:bg-accent align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Pencil className="size-5" />
                      </Link>

                      <button
                        className="inline-flex p-2 rounded-md hover:bg-accent align-middle cursor-pointer"
                        aria-label="Șterge"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDelete(p.slug, p.name);
                        }}
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="text-sm text-muted-foreground justify-center">
          Lista proiectelor create de tine.
        </CardFooter>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-2 border-red-500 animate-shake">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Această acțiune este ireversibilă!
            </AlertDialogTitle>
            <AlertDialogDescription>
              {`Ești sigur că vrei să ștergi proiectul${
                target?.name ? ` „${target.name}”` : ""
              }? Nu vei putea anula această acțiune.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Nu</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
            >
              {deleting ? "Se șterge..." : "Da, șterge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
