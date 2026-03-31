// pagina de login

"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const handleLogin = () => {
    signIn("keycloak", { callbackUrl: "/listofprojects" }, { prompt: "login" });
    // vezi ca acum din cauza acestui prompt, dupa logout trebuie
    // neaparat sa intri cu acelasi cont, nu ai si optiunea de register, mai necesita atentie !!!
  };

  return (
    <main className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-5 border rounded-xl p-6">
        <h1 className="text-2xl font-semibold text-center">Autentificare</h1>

        <Button
          className="w-full border rounded-md p-3 cursor-pointer"
          onClick={handleLogin}
        >
          Conectare cu Keycloak
        </Button>
      </div>
    </main>
  );
}
