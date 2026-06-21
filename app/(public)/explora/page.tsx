import type { Metadata } from "next";
import { ExploraClient } from "@/components/public/explora-client";

export const metadata: Metadata = { title: "Explora" };

export default function ExploraPage() {
  return <ExploraClient />;
}
