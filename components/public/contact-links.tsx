import styles from "./contact-links.module.css";

const contacts = {
  whatsapp: "https://wa.me/529987175692",
  facebook: "https://www.facebook.com/share/1BoqxhmgPv/?mibextid=wwXIfr",
  instagram: "https://www.instagram.com/eternime_org/",
};

export function ContactLinks() {
  return (
    <section className={styles.contact} aria-label="Contacto de Eternime">
      <div className={styles.intro}>
        <span className={styles.eyebrow}>ESTAMOS CERCA</span>
        <h2>Hablemos de Eternime.</h2>
        <p>¿Tienes preguntas sobre la app o cómo participar en el proyecto? Escríbenos.</p>
      </div>
      <div className={styles.channels}>
        <a className={styles.whatsapp} href={contacts.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Contactar a Eternime por WhatsApp al +52 998 717 5692 (abre otra ventana)">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.6-4.9A8.5 8.5 0 1 1 20.5 11.5Z" />
            <path d="m8.3 7.6 1.3-.3 1.1 2.5-.9.8c.7 1.4 1.8 2.5 3.2 3.2l.8-.9 2.5 1.1-.3 1.3c-.2.9-1.2 1.3-2 1-3.8-1.1-6.8-4.1-6.8-7.1 0-.7.5-1.3 1.1-1.6Z" />
          </svg>
          <span><b>Escríbenos por WhatsApp</b><small>+52 998 717 5692</small></span>
          <span className={styles.arrow} aria-hidden="true">↗</span>
        </a>
        <div className={styles.socials} role="group" aria-label="Redes sociales de Eternime">
          <a href={contacts.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook de Eternime (abre otra ventana)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M14 21v-8h2.7l.4-3H14V8.1c0-.9.3-1.6 1.6-1.6h1.6V3.8c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.2V10H8v3h2.8v8H14Z" /></svg>
            <span>Facebook</span><span aria-hidden="true">↗</span>
          </a>
          <a href={contacts.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram de Eternime, @eternime_org (abre otra ventana)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
            <span>Instagram</span><span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
