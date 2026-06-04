import type { Metadata } from "next";
import { FadeInOnScroll } from "@/components/motion";
import { DeliveryQueue } from "@/components/admin/DeliveryQueue";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · Cartas" };

export default function AdminCartasPage() {
  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <h1 className="et-serif text-2xl text-[var(--et-text)]">Cola de entrega</h1>
        <p className="mt-1 text-sm text-[var(--et-text-muted)]">
          Cartas de legado con entrega próxima — el corazón operativo de Eternime.
        </p>
      </FadeInOnScroll>
      <DeliveryQueue />
    </div>
  );
}
