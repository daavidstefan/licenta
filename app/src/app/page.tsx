// pagina de start redirectioneaza catre login

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}
