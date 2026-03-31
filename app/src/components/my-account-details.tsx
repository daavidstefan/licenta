"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarDays, User, Mail, IdCard } from "lucide-react";
import { EmailStatusCell } from "@/components/EmailStatusCell";

type AccountDetails = {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  created_at: string;
};

export default function MyAccountDetailsCard({
  details,
}: {
  details: AccountDetails[];
}) {
  const user = details[0];

  return (
    <div className="p-6">
      <Card className="lg:col-span-1 lg:col-start-2 justify-self-center w-[calc(65vw-3rem)] h-[calc(92vh-3rem)] overflow-y-auto p-6 flex flex-col">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-center text-lg">
            Salut,{" "}
            <span className="text-primary font-semibold">
              {user.first_name}!
            </span>
          </CardTitle>
        </CardHeader>

        <Separator className="h-[10px]" />

        <CardContent className="flex flex-col flex-1 justify-center">
          <div className="grid  gap-4">
            <div className="flex flex-col gap-1">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Username
              </Label>
              <Input value={user.username} disabled />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Prenume
              </Label>
              <Input value={user.first_name} disabled />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Nume
              </Label>
              <Input value={user.last_name} disabled />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Email
                <EmailStatusCell value={"unverified"} />
              </Label>
              <Input value={user.email} disabled />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Data creării contului
              </Label>
              <Input
                value={new Date(user.created_at).toLocaleDateString("ro-RO")}
                disabled
              />
            </div>
          </div>
        </CardContent>

        <Separator className="!h-[1.5px]" />

        <CardFooter className="text-sm text-muted-foreground justify-center">
          <div className="flex items-center h-8">Detaliile contului tău.</div>
        </CardFooter>
      </Card>
    </div>
  );
}
