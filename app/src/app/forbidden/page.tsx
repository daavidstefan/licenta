"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, LockKeyhole, ShieldAlert } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function ForbiddenPage() {
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/listofprojects");
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-6 flex items-center justify-center">
      <Card className="w-full max-w-xl p-6">
        <CardHeader className="items-center justify-items-center text-center space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full border bg-destructive/10 text-destructive">
            <ShieldAlert className="size-8" />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl">Ups.. nu ai acces aici!</CardTitle>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="text-center text-sm text-muted-foreground leading-6">
          Contul tau nu are permisiunile necesare pentru aceasta pagina. Daca ai
          ajuns aici din greseala, te poti intoarce la pagina anterioara.
        </CardContent>

        <CardFooter className="justify-center">
          <Button onClick={goBack} className="cursor-pointer">
            <ArrowLeft className="size-4" />
            Inapoi
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
