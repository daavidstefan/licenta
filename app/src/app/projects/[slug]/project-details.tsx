// componenta care afiseaza detaliile proiectului si controale de editare
// primeste props de la \projects\[slug]\page.tsx

"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Pen, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { CirclePlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { randomBytes } from "crypto"; // pentru producerea de dummy keys - momentan

type Feature = { id: number; key: string; label: string };

export default function ProjectDetails({
  project,
  features,
  canEdit = false,
}: {
  project: {
    id?: number;
    slug?: string;
    name: string;
    details: string;
    created_by: string;
    created_at?: string | Date;
  };
  features: Feature[];
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(project.name);
  const [draftDetails, setDraftDetails] = useState(project.details || "");
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraftName(project.name);
    setDraftDetails(project.details || "");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const saveEdit = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/projects/${project.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draftName, details: draftDetails }),
      });
      if (!res.ok) throw new Error("Save failed");

      toast.success("Modificări salvate!");
      project.name = draftName;
      project.details = draftDetails;
      setIsEditing(false);
      router.refresh?.();
    } catch (error) {
      toast.error("Nu am putut salva modificările!");
    } finally {
      setSaving(false);
    }
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deleteProject = async () => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!project.slug) {
      toast.error("Slug inexistent pentru proiect.");
      setConfirmOpen(false);
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch(`/api/projects/${project.slug}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");

      toast.success("Proiect șters!");
      router.push("/myprojects");
    } catch (e) {
      toast.error("Nu am putut șterge proiectul.");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const [featureList, setFeatureList] = useState(features);
  const [addFeatOpen, setAddFeatOpen] = useState(false);
  const [addFeatLabel, setAddFeatLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const submitAddFeature = async () => {
    const label = addFeatLabel.trim();
    if (!label) return;

    // evit duplicatel
    if (
      featureList.some((f) => f.label.toLowerCase() === label.toLowerCase())
    ) {
      toast.error("Există deja un serviciu cu acest nume.");
      return;
    }

    try {
      setAdding(true);
      // endpoint-ul
      const res = await fetch(`/api/projects/${project.slug}/features`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) throw new Error();

      const created: Feature = await res.json(); // { id, key, label }
      setFeatureList((prev) => [...prev, created]);
      setAddFeatLabel("");
      setAddFeatOpen(false);
      toast.success("Serviciu adăugat.");
    } catch {
      toast.error("Nu am putut adăuga serviciul.");
    } finally {
      setAdding(false);
    }
  };

  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (id: number, checked: boolean) =>
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );

  const unselect = (id: number) =>
    setSelected((prev) => prev.filter((x) => x !== id));

  const selectedFeatures = featureList.filter((f) => selected.includes(f.id));

  const [confirmFeatOpen, setConfirmFeatOpen] = useState(false);
  const [deletingFeatures, setDeletingFeatures] = useState(false);

  const handleConfirmDeleteFeatures = async () => {
    try {
      setDeletingFeatures(true);
      const res = await fetch(`/api/projects/${project.slug}/features`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureIds: selected }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Delete failed");
      }

      setFeatureList((prev) => prev.filter((f) => !selected.includes(f.id)));
      setSelected([]);
      toast.success("Serviciile selectate au fost șterse.");
    } catch (e: any) {
      toast.error(e?.message || "Nu am putut șterge serviciile selectate.");
    } finally {
      setDeletingFeatures(false);
      setConfirmFeatOpen(false);
    }
  };

  const generateLicense = async () => {
    try {
      const res = await fetch(`/api/projects/${project.slug}/generate-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success(data.message);
      router.push("/mylicenses");
      //toast.success("Cheia a fost generată cu succes!");
    } catch (error) {
      toast.error(JSON.stringify(error));
    }
  };

  return (
    <div className="grid gap-6 p-6 h-[93vh] lg:grid-cols-[40%_58.4%] items-stretch">
      <Card className="flex-[1] min-h-0 overflow-auto scrollbar-none ms-overflow-style-none [&::-webkit-scrollbar]:hidden">
        <CardHeader>
          <div className="relative flex items-center justify-center py-2">
            {!isEditing && (
              <CardTitle className="text-lg">{project.name}</CardTitle>
            )}

            {isEditing && (
              <div className="w-full">
                <Input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="text-lg w-full text-center"
                  placeholder="Titlu proiect"
                />
                <div
                  className={`text-sm mt-1 ${
                    draftName.trim().length < 10
                      ? "text-red-500"
                      : "text-green-600"
                  } text-center`}
                >
                  {draftName.trim().length}/10 caractere
                </div>
              </div>
            )}

            {!isEditing && canEdit && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  className="cursor-pointer p-2 rounded-md hover:bg-accent"
                  aria-label="Editează"
                  onClick={startEdit}
                >
                  <Pencil className="size-5" />
                </button>

                <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                  <AlertDialogTrigger asChild>
                    <button
                      className="cursor-pointer p-2 rounded-md hover:bg-accent"
                      aria-label="Șterge proiect"
                      onClick={deleteProject}
                      disabled={deleting}
                    >
                      <Trash2 className="size-5" />
                    </button>
                  </AlertDialogTrigger>

                  <AlertDialogContent className="border-1 border-red-500 animate-shake">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-600">
                        Această acțiune este ireversibilă!
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Ești sigur că vrei să ștergi proiectul? Nu vei putea
                        anula această acțiune.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Nu</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleConfirmDelete}
                        className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                      >
                        Șterge
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </CardHeader>
        <div className="text-sm px-6">
          <h1>Creat de: {`${project.created_by}`}</h1>
        </div>
        <CardContent className="text-sm text-muted-foreground">
          {isEditing ? (
            <>
              <Textarea
                value={draftDetails}
                onChange={(e) => {
                  setDraftDetails(e.target.value);
                  e.currentTarget.style.height = "auto";
                  e.currentTarget.style.height =
                    e.currentTarget.scrollHeight + "px";
                }}
                placeholder="Descriere proiect"
                className="w-full rounded-md border px-3 py-2 text-sm outline-none resize-none overflow-hidden"
              />

              <div
                className={`text-sm mt-1 ${
                  draftDetails.trim().length < 50
                    ? "text-red-500"
                    : "text-green-600"
                }`}
              >
                {draftDetails.trim().length}/50 caractere
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="cursor-pointer"
                >
                  Renunță la modificări
                </Button>
                <Button
                  variant="success"
                  onClick={saveEdit}
                  disabled={
                    saving ||
                    draftDetails.trim().length < 50 ||
                    draftName.trim().length < 10
                  }
                  className="cursor-pointer"
                >
                  {saving ? "Se salvează..." : "Salvează modificările"}
                </Button>
              </div>
            </>
          ) : (
            <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] break-all text-left w-full">
              {project.details || "—"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* lista features + sectiunea de generate key */}
      <div className="flex flex-col gap-6 h-full min-h-0">
        {/* lista features */}
        <Card className="flex-[1] min-h-0 overflow-auto scrollbar-none ms-overflow-style-none [&::-webkit-scrollbar]:hidden">
          <CardHeader className="relative flex items-center justify-center py-2">
            <CardTitle className="text-lg">Servicii</CardTitle>

            {canEdit && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <AlertDialog
                  open={addFeatOpen}
                  onOpenChange={(o) => {
                    setAddFeatOpen(o);
                    if (!o) setAddFeatLabel("");
                  }}
                >
                  <AlertDialogTrigger asChild>
                    <button
                      className="cursor-pointer p-2 rounded-md hover:bg-accent"
                      aria-label="Adaugă serviciu"
                    >
                      <CirclePlus className="size-5" />
                    </button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Adaugă serviciu</AlertDialogTitle>
                      <AlertDialogDescription>
                        Introdu denumirea unui nou serviciu pentru acest
                        proiect.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="mt-2">
                      <Input
                        value={addFeatLabel}
                        onChange={(e) => setAddFeatLabel(e.target.value)}
                        placeholder="Ex: Export CSV"
                        autoFocus
                      />
                    </div>

                    <AlertDialogFooter>
                      <AlertDialogCancel className="cursor-pointer">
                        Renunță
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="cursor-pointer bg-green-600"
                        onClick={submitAddFeature}
                        disabled={adding || !addFeatLabel.trim()}
                      >
                        {adding ? "Se adaugă..." : "Adaugă"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-4">
            <div className="mx-auto w-[100%] rounded-md border">
              <div className="overflow-auto">
                <Table
                  className="
                    w-full table-fixed
                    [&_th]:align-middle [&_td]:align-middle
                    [&_th]:px-8 [&_td]:px-8
                    [&_th:first-child]:pl-6 [&_td:first-child]:pl-6
                    [&_th:last-child]:pr-6  [&_td:last-child]:pr-6
                    [&_th:last-child]:text-right [&_td:last-child]:text-right
                  "
                >
                  <colgroup>
                    <col />
                    <col className="w-[100px]" />
                  </colgroup>

                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>Denumire</TableHead>
                      <TableHead className="w-[100px]">Alege</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {featureList.map((f) => {
                      const checked = selected.includes(f.id);
                      return (
                        <TableRow
                          key={f.id}
                          data-state={checked ? "selected" : undefined}
                          className="cursor-pointer hover:bg-accent/40 data-[state=selected]:bg-accent/60 transition-colors"
                          onClick={() => toggle(f.id, !checked)}
                        >
                          <TableCell className="w-1/2">
                            <div className="font-medium break-words whitespace-normal">
                              {f.label}
                            </div>
                          </TableCell>

                          <TableCell className="w-1/2 text-right">
                            <span
                              className="inline-flex"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                className="cursor-pointer"
                                checked={checked}
                                onCheckedChange={(v) =>
                                  toggle(f.id, Boolean(v))
                                }
                                aria-label={`Selectează ${f.label}`}
                              />
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* sectiunea de generate key */}
        <Card className="flex-[1] min-h-0 overflow-auto scrollbar-none ms-overflow-style-none [&::-webkit-scrollbar]:hidden">
          <CardHeader className="relative flex items-center justify-center py-2">
            <CardTitle className="absolute left-1/2 -translate-x-1/2 text-lg">
              Obține cheia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Servicii alese:
              </div>

              <div className="rounded-md border p-3 min-h-16">
                {selectedFeatures.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    - niciunul -
                  </div>
                ) : (
                  <TooltipProvider delayDuration={150}>
                    <div className="flex flex-wrap gap-2">
                      {selectedFeatures.map((f) => (
                        <Badge
                          key={f.id}
                          variant="outline"
                          className="inline-flex items-center gap-1 text-muted-foreground pl-2 pr-1 min-w-0 whitespace-normal h-auto"
                        >
                          <span className="min-w-0 break-all whitespace-normal">
                            {f.label}
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => unselect(f.id)}
                                className="ml-1 rounded p-0.5 hover:bg-muted cursor-pointer"
                                aria-label={`Elimină ${f.label}`}
                              >
                                <X className="size-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Elimină</TooltipContent>
                          </Tooltip>
                        </Badge>
                      ))}
                    </div>
                  </TooltipProvider>
                )}
              </div>

              <Separator />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="success"
                  className="cursor-pointer"
                  disabled={selectedFeatures.length === 0}
                  onClick={generateLicense}
                >
                  Generează licența!
                </Button>

                {canEdit && selected.length > 0 && (
                  <AlertDialog
                    open={confirmFeatOpen}
                    onOpenChange={setConfirmFeatOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="cursor-pointer"
                        onClick={() => setConfirmFeatOpen(true)}
                        title="Șterge serviciile selectate"
                      >
                        Șterge serviciile selectate
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent className="border-1 border-red-500 animate-shake">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">
                          Această acțiune este ireversibilă!
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Ești sigur că vrei să ștergi elementele selectate? Nu
                          vei putea anula această acțiune.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">
                          Renunță
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 cursor-pointer"
                          onClick={handleConfirmDeleteFeatures}
                          disabled={deletingFeatures}
                        >
                          {deletingFeatures ? "Se șterge..." : "Șterge"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
