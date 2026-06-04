import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Entrar" };

export default function EntrarPage() {
  return <AuthForm mode="login" />;
}
