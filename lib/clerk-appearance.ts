/**
 * Tema visual de Clerk (SignIn/SignUp/UserButton/avatar) en los colores de
 * marca de Eternime "La luz que se queda": obsidiana + oro único (#C9A961).
 * Mata el morado/índigo por defecto de Clerk en avatares y acentos.
 */
export const eternimeClerkAppearance = {
  variables: {
    colorPrimary: "#8f84ff",
    colorBackground: "#0c0c0f",
    colorInputBackground: "rgba(10, 10, 12, 0.7)",
    colorInputText: "#f7f7fa",
    colorText: "#f7f7fa",
    colorTextSecondary: "#9b9daa",
    colorDanger: "#e38c87",
    colorSuccess: "#86c99a",
    borderRadius: "14px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  elements: {
    card: {
      backgroundColor: "#0c0c0f",
      border: "1px solid #1e1e24",
      boxShadow: "0 28px 120px rgba(0, 0, 0, 0.56)",
    },
    headerTitle: { fontFamily: "var(--font-eternime), ui-sans-serif, system-ui, sans-serif", color: "#f7f7fa" },
    headerSubtitle: { color: "#9b9daa" },
    formButtonPrimary: {
      background: "linear-gradient(135deg, #c9a961, #dbbc78)",
      color: "#08080b",
      boxShadow: "0 0 24px rgba(122, 112, 255, 0.22)",
      "&:hover": { background: "linear-gradient(135deg, #dbbc78, #dbbc78)" },
    },
    footerActionLink: { color: "#b7b0ff" },
    socialButtonsBlockButton: {
      backgroundColor: "rgba(122, 112, 255, 0.06)",
      border: "1px solid #1e1e24",
      color: "#f7f7fa",
    },
    dividerLine: { backgroundColor: "#202027" },
    dividerText: { color: "#9b9daa" },
    avatarBox: { backgroundColor: "#0c0c0f", color: "#b7b0ff" },
    userButtonAvatarBox: { backgroundColor: "#0c0c0f", color: "#b7b0ff" },
  },
};
