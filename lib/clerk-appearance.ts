/**
 * Tema visual de Clerk (SignIn/SignUp/UserButton/avatar) en los colores de
 * marca de Eternime "La luz que se queda": obsidiana + oro único (#C9A961).
 * Mata el morado/índigo por defecto de Clerk en avatares y acentos.
 */
export const eternimeClerkAppearance = {
  variables: {
    colorPrimary: "#c9a961",
    colorBackground: "#121216",
    colorInputBackground: "rgba(10, 10, 12, 0.7)",
    colorInputText: "#f4efe6",
    colorText: "#f4efe6",
    colorTextSecondary: "#9b958a",
    colorDanger: "#d98f7a",
    colorSuccess: "#9bbf88",
    borderRadius: "14px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  elements: {
    card: {
      backgroundColor: "#121216",
      border: "1px solid #1e1e24",
      boxShadow: "0 28px 120px rgba(0, 0, 0, 0.56)",
    },
    headerTitle: { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", color: "#f4efe6" },
    headerSubtitle: { color: "#9b958a" },
    formButtonPrimary: {
      background: "linear-gradient(135deg, #c9a961, #dbbc78)",
      color: "#16120a",
      boxShadow: "0 0 24px rgba(201, 169, 97, 0.22)",
      "&:hover": { background: "linear-gradient(135deg, #dbbc78, #dbbc78)" },
    },
    footerActionLink: { color: "#dbbc78" },
    socialButtonsBlockButton: {
      backgroundColor: "rgba(201, 169, 97, 0.05)",
      border: "1px solid #1e1e24",
      color: "#f4efe6",
    },
    dividerLine: { backgroundColor: "#1e1e24" },
    dividerText: { color: "#9b958a" },
    avatarBox: { backgroundColor: "#121216", color: "#dbbc78" },
    userButtonAvatarBox: { backgroundColor: "#121216", color: "#dbbc78" },
  },
};
