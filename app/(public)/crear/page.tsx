import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Crear mi legado" };

export default function CrearPage() {
  return <AuthForm mode="register" />;
}
