// buton folosit in tabele

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function TableButton({
  slug,
  label = "Vezi",
}: {
  slug: string;
  label?: string;
}) {
  const router = useRouter();
  return (
    <Button
      className="cursor-pointer"
      size="sm"
      onClick={() => router.push(`/projects/${slug}`)}
    >
      {label}
    </Button>
  );
}
