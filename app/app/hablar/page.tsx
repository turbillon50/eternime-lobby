import type { Metadata } from "next";
import { HablarConEon } from "@/components/app/HablarConEon";

export const metadata: Metadata = { title: "Habla con Eon" };

export default function HablarPage() {
  return <HablarConEon />;
}
