"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ContactDetailsCard() {
  return (
    <div className="p-6">
      <Card className="lg:col-span-1 lg:col-start-2 justify-self-center w-[calc(65vw-3rem)] h-[calc(92vh-3rem)] overflow-y-auto p-6 flex flex-col">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-center text-lg">
            Vezi mai jos opțiunile de contact!
          </CardTitle>
        </CardHeader>

        <Separator className="h-[10px]" />

        <CardContent className="flex flex-col flex-1 justify-center">
          <h1>
            aici vor fi afisate optiunile de contact. + optiunea de a crea
            tichete, odata ce au fost stabilite sesiunile din keycloak. clientul
            si dezvoltaturl vad optiunile de contact + optiunea de a face
            tichet, iar adminul vede toate tichetele create.
          </h1>
        </CardContent>

        <Separator className="!h-[1.5px]" />

        <CardFooter className="text-sm text-muted-foreground justify-center">
          <div className="flex items-center h-8">Opțiuni de contact.</div>
        </CardFooter>
      </Card>
    </div>
  );
}
