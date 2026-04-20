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
import { Separator } from "@radix-ui/react-separator";
import { Badge } from "@/components/ui/badge";
import { LicenseKeyCell } from "@/components/LicenseKeyCell";
import { LicenseStatusCell } from "@/components/LicenseStatusCell";

type License = {
  id: number;
  owner_id: string;
  license_key: string;
  created_at: string | Date;
  expires_at: string | Date | null;
  status: string;
  linked_project: string;
  feature_labels: string[];
};

function formatDate(value: string | Date | null) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("ro-RO");
}

export default function MyLicensesTable({ licenses }: { licenses: License[] }) {
  const hasData = licenses && licenses.length > 0;

  return (
    <div className="app-page">
      <Card className="app-panel app-panel-wide overflow-y-auto flex flex-col">
        <CardHeader>
          <div className="h-full flex flex-col items-center justify-center text-center gap-2">
            <CardTitle className="text-lg">Licențele mele</CardTitle>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[8%]">ID</TableHead>
                <TableHead className="w-[18%]">Proiect</TableHead>
                <TableHead className="w-[20%]">Cheia</TableHead>
                <TableHead className="w-[24%]">Servicii</TableHead>
                <TableHead className="w-[12%]">Emisă la</TableHead>
                <TableHead className="w-[12%]">Expiră la</TableHead>
                <TableHead className="w-[10%]">Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!hasData ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground text-center py-24"
                  >
                    Nu am găsit nicio licență.
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
                      {license.feature_labels.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {license.feature_labels.map((label) => (
                            <Badge
                              key={`${license.id}-${label}`}
                              variant="outline"
                            >
                              {label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>{formatDate(license.created_at)}</TableCell>

                    <TableCell>{formatDate(license.expires_at)}</TableCell>

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
