import type { Metadata } from "next";
import styles from "@/components/public/contact-links.module.css";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contacta al equipo de Eternime por WhatsApp y encuentra nuestras redes sociales.",
};

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <h1>Contacto</h1>
      <p>Conversa con nuestro equipo sobre Eternime, recibe orientación para usar la app o conoce cómo participar en el proyecto.</p>
    </div>
  );
}
