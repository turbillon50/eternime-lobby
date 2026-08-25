/**
 * Tema visual de Clerk (SignIn/SignUp/UserButton/avatar) en el lenguaje EON:
 * negro OLED + violeta/ultravioleta. Mata el morado/índigo por defecto de
 * Clerk y lo alinea con el resto de la aplicación.
 */
export const eternimeClerkAppearance = {
  variables: {
    colorPrimary: "#8b5cff",
    colorBackground: "#09090e",
    colorInputBackground: "rgba(255, 255, 255, 0.035)",
    colorInputText: "#f4efe8",
    colorText: "#f4efe8",
    colorTextSecondary: "#96929f",
    colorDanger: "#ff8f7a",
    colorSuccess: "#6fe3a8",
    borderRadius: "16px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  elements: {
    card: {
      backgroundColor: "rgba(6, 6, 10, 0.86)",
      border: "1px solid rgba(255, 255, 255, 0.09)",
      boxShadow:
        "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 30px 70px -20px rgba(0, 0, 0, 1), 0 0 44px -18px rgba(109, 54, 255, 0.5)",
      backdropFilter: "blur(22px) saturate(120%)",
    },
    headerTitle: { color: "#f4efe8", letterSpacing: "-0.035em" },
    headerSubtitle: { color: "#96929f" },
    formButtonPrimary: {
      background: "linear-gradient(150deg, #8b5cff, #6d36ff 74%)",
      color: "#ffffff",
      border: "1px solid rgba(139, 92, 255, 0.5)",
      boxShadow: "0 10px 30px -10px rgba(109, 54, 255, 0.85)",
      "&:hover": { background: "linear-gradient(150deg, #9a70ff, #7b46ff 74%)" },
    },
    footerActionLink: { color: "#8b5cff" },
    socialButtonsBlockButton: {
      backgroundColor: "rgba(255, 255, 255, 0.045)",
      border: "1px solid rgba(255, 255, 255, 0.09)",
      color: "#f4efe8",
    },
    dividerLine: { backgroundColor: "rgba(255, 255, 255, 0.09)" },
    dividerText: { color: "#96929f" },
    avatarBox: { backgroundColor: "#09090e", color: "#8b5cff" },
    userButtonAvatarBox: { backgroundColor: "#09090e", color: "#8b5cff" },
  },
};
