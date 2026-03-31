// tabel pentru licentele mele

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
import { LicenseKeyCell } from "@/components/LicenseKeyCell";
import { LicenseStatusCell } from "@/components/LicenseStatusCell";

type License = {
  id: number;
  owner_id: string;
  license_key: string;
  created_at: Date;
  expires_at: string;
  status: string;
  linked_project: string;
};

export default function MyLicensesTable({ licenses }: { licenses: License[] }) {
  const hasData = licenses && licenses.length > 0;

  return (
    <div className="p-6">
      <Card className="lg:col-span-1 lg:col-start-2 justify-self-center w-[calc(65vw-3rem)] h-[calc(92vh-3rem)] overflow-y-auto p-6 flex flex-col">
        <CardHeader>
          <div className="h-full flex flex-col items-center justify-center text-center gap-2">
            <CardTitle className="text-lg">Licențele mele</CardTitle>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="flex-1">
          {/* <h1 className="text-center py-60">Work in progress...</h1> */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[10%]">ID</TableHead>
                <TableHead className="w-[20%]">Proiect</TableHead>
                <TableHead className="w-[25%]">Cheia</TableHead>
                <TableHead className="w-[20%]">Data emiterii</TableHead>
                <TableHead className="w-[20%]">Data expirării</TableHead>
                <TableHead className="w-[18%]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!hasData ? (
                <TableRow disableHover>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground text-center py-24"
                  >
                    Nu am găsit nicio licență..
                  </TableCell>
                </TableRow>
              ) : (
                licenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell>{license.id}</TableCell>
                    <TableCell>{license.linked_project}</TableCell>
                    <TableCell>
                      <LicenseKeyCell value={license.license_key} />
                    </TableCell>
                    <TableCell>
                      {license.created_at.toLocaleDateString()}
                    </TableCell>
                    <TableCell>{license.expires_at}</TableCell>
                    <TableCell>
                      <LicenseStatusCell value={license.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="text-sm text-muted-foreground justify-center">
          Lista licențelor tale.
        </CardFooter>
      </Card>
    </div>
  );
}
