// buton din navbar

"use client";

import { Button } from "@/components/ui/button";
import * as React from "react";

type NavbarButtonProps = React.ComponentProps<typeof Button>;

export function NavbarButton(props: NavbarButtonProps) {
  return (
    <Button className="cursor-pointer" variant="default" size="sm" {...props} />
  );
}
