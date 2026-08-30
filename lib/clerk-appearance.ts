/**
 * Tema visual de Clerk alineado con EON: negro OLED, violeta y magenta.
 * No usa dorados ni ámbar en autenticación.
 */
export const eternimeClerkAppearance = {
  variables: {
    colorPrimary: "#7c3cff",
    colorBackground: "#08080c",
    colorInputBackground: "rgba(18, 16, 26, 0.92)",
    colorInputText: "#f7f5ff",
    colorText: "#f7f5ff",
    colorTextSecondary: "#aaa5b6",
    colorDanger: "#d98f7a",
    colorSuccess: "#9bbf88",
    borderRadius: "14px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  elements: {
    card: {
      background: "linear-gradient(145deg, rgba(15, 12, 23, 0.98), rgba(5, 5, 9, 0.99))",
      border: "1px solid rgba(166, 126, 255, 0.18)",
      boxShadow: "0 32px 120px rgba(0, 0, 0, 0.72), inset 0 1px rgba(255, 255, 255, 0.08)",
      backdropFilter: "blur(28px) saturate(145%)",
    },
    headerTitle: { fontFamily: "ui-sans-serif, system-ui, sans-serif", color: "#f7f5ff", fontWeight: 650 },
    headerSubtitle: { color: "#aaa5b6" },
    formButtonPrimary: {
      background: "linear-gradient(135deg, #6d36ff 0%, #8b5cff 52%, #c44dff 100%)",
      color: "#ffffff",
      boxShadow: "0 12px 34px rgba(109, 54, 255, 0.34), inset 0 1px rgba(255, 255, 255, 0.24)",
      "&:hover": { background: "linear-gradient(135deg, #7c48ff 0%, #9b6dff 52%, #d261ff 100%)" },
      "&:focus-visible": { boxShadow: "0 0 0 3px rgba(139, 92, 255, 0.42), 0 12px 34px rgba(109, 54, 255, 0.34)" },
    },
    footerActionLink: { color: "#bda9ff" },
    socialButtonsBlockButton: {
      backgroundColor: "rgba(139, 92, 255, 0.06)",
      border: "1px solid rgba(255, 255, 255, 0.10)",
      color: "#f7f5ff",
    },
    formFieldInput: {
      border: "1px solid rgba(255, 255, 255, 0.10)",
      boxShadow: "inset 0 1px rgba(255, 255, 255, 0.04)",
      "&:focus": { borderColor: "#8b5cff", boxShadow: "0 0 0 3px rgba(139, 92, 255, 0.16)" },
    },
    dividerLine: { backgroundColor: "rgba(255, 255, 255, 0.10)" },
    dividerText: { color: "#aaa5b6" },
    avatarBox: { backgroundColor: "#0d0b14", color: "#bda9ff" },
    userButtonAvatarBox: { backgroundColor: "#0d0b14", color: "#bda9ff" },
  },
};
