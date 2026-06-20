import { redirect } from "next/navigation";

// /home era un placeholder de Fase 1 con tarjetas a rutas inexistentes
// (/conversar y /memorias/nueva). El dashboard real es /app. Redirigimos
// para que el login/onboarding nunca caigan en un callejón sin salida.
export default function HomePage() {
  redirect("/app");
}
