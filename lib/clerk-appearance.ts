/**
 * Tema visual de Clerk (SignIn/SignUp/UserButton) en los colores de marca
 * de Eternime, leidos directos de styles/globals.css (tokens --et-*) para
 * que los widgets de Clerk se sientan parte del sitio, no un componente
 * pegado encima.
 */
export const eternimeClerkAppearance = {
  variables: {
    colorPrimary: "#ffffff",
    colorBackground: "#12121a",
    colorInputBackground: "rgba(0, 0, 0, 0.34)",
    colorInputText: "#f5f2ea",
    colorText: "#f5f2ea",
    colorTextSecondary: "rgba(245, 242, 234, 0.62)",
    colorDanger: "#e07a6a",
    colorSuccess: "#8fc8a0",
    borderRadius: "0.9rem",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  elements: {
    card: {
      backgroundColor: "#12121a",
      border: "1px solid rgba(255, 255, 255, 0.12)",
      boxShadow: "0 28px 120px rgba(0, 0, 0, 0.56)",
    },
    headerTitle: { fontFamily: "Georgia, 'Times New Roman', ui-serif, serif", color: "#ffffff" },
    headerSubtitle: { color: "rgba(245, 242, 234, 0.62)" },
    formButtonPrimary: {
      backgroundColor: "#ffffff",
      color: "#08080c",
      boxShadow: "0 0 24px rgba(255, 255, 255, 0.22)",
      "&:hover": { backgroundColor: "#f5f2ea" },
    },
    footerActionLink: { color: "#ffffff" },
    socialButtonsBlockButton: {
      backgroundColor: "rgba(255, 255, 255, 0.035)",
      border: "1px solid rgba(255, 255, 255, 0.18)",
      color: "#f5f2ea",
    },
    dividerLine: { backgroundColor: "rgba(255, 255, 255, 0.12)" },
    dividerText: { color: "rgba(245, 242, 234, 0.38)" },
  },
};
