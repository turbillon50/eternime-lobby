/**
 * Iconografía propia de Eternime. SVG inline, stroke 1.6, viewBox 24,
 * alineación óptica consistente. NO se usa lucide ni ninguna librería:
 * el set es propio para que el trazo case con el lenguaje EON.
 */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function S({ size = 20, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden focusable="false" {...rest}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: P) => <S {...p}><path d="M4 10.4 12 4l8 6.4V19a1 1 0 0 1-1 1h-4.2v-5.2H9.2V20H5a1 1 0 0 1-1-1z" /></S>;
export const IconMemory = (p: P) => <S {...p}><path d="M12 4.5v15M8.6 5.2A3.4 3.4 0 0 0 5.4 8.6a3.4 3.4 0 0 0 0 6.8 3.4 3.4 0 0 0 3.2 3.4M15.4 5.2a3.4 3.4 0 0 1 3.2 3.4 3.4 3.4 0 0 1 0 6.8 3.4 3.4 0 0 1-3.2 3.4" /><path d="M8.4 9.6H12M12 14.4h3.6" /></S>;
export const IconPeople = (p: P) => <S {...p}><path d="M15.6 10.4a3.6 3.6 0 1 0-7.2 0" /><circle cx="12" cy="7" r="3" /><path d="M4.5 20v-.8A5.2 5.2 0 0 1 9.7 14h4.6a5.2 5.2 0 0 1 5.2 5.2V20" /></S>;
export const IconProjects = (p: P) => <S {...p}><path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h3.2l1.8 2h8A1.5 1.5 0 0 1 20 9.5v8A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z" /></S>;
export const IconTimeline = (p: P) => <S {...p}><circle cx="12" cy="12" r="8" /><path d="M12 7.6V12l2.8 1.8" /></S>;
export const IconVault = (p: P) => <S {...p}><rect x="4" y="4.5" width="16" height="15" rx="2" /><circle cx="12" cy="12" r="3.2" /><path d="M12 8.8V6.2M12 17.8v-2.6M15.2 12h2.6M6.2 12h2.6" /></S>;
export const IconSearch = (p: P) => <S {...p}><circle cx="11" cy="11" r="6.2" /><path d="m15.6 15.6 3.4 3.4" /></S>;
export const IconBell = (p: P) => <S {...p}><path d="M6.6 10a5.4 5.4 0 0 1 10.8 0c0 4 1.6 5.4 1.6 5.4H5s1.6-1.4 1.6-5.4Z" /><path d="M10.4 18.4a1.9 1.9 0 0 0 3.2 0" /></S>;
export const IconMenu = (p: P) => <S {...p}><path d="M4.5 7.5h15M4.5 12h15M4.5 16.5h15" /></S>;
export const IconClose = (p: P) => <S {...p}><path d="m6.5 6.5 11 11M17.5 6.5l-11 11" /></S>;
export const IconUser = (p: P) => <S {...p}><circle cx="12" cy="8.4" r="3.6" /><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" /></S>;
export const IconLetter = (p: P) => <S {...p}><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 5.6L20 7" /></S>;
export const IconIas = (p: P) => <S {...p}><rect x="7.5" y="7.5" width="9" height="9" rx="2" /><path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" /></S>;
export const IconTask = (p: P) => <S {...p}><circle cx="12" cy="12" r="8" /><path d="m8.6 12.2 2.4 2.4 4.4-4.8" /></S>;
export const IconVoice = (p: P) => <S {...p}><rect x="9.4" y="3.5" width="5.2" height="10" rx="2.6" /><path d="M5.8 11.4a6.2 6.2 0 0 0 12.4 0M12 17.6V20.5" /></S>;
export const IconSpark = (p: P) => <S {...p}><path d="M12 4.2 13.5 9l4.8 1.5-4.8 1.5L12 16.8 10.5 12 5.7 10.5 10.5 9z" /><path d="M18.4 4v2.6M19.7 5.3h-2.6" /></S>;
export const IconArrow = (p: P) => <S {...p}><path d="M5 12h13M12.6 6.2 18.4 12l-5.8 5.8" /></S>;
export const IconPlus = (p: P) => <S {...p}><path d="M12 5.6v12.8M5.6 12h12.8" /></S>;
export const IconClip = (p: P) => <S {...p}><path d="M16.8 11.2 11.6 16.4a3.4 3.4 0 0 1-4.8-4.8l6-6a2.3 2.3 0 0 1 3.2 3.2l-6 6a1.1 1.1 0 0 1-1.6-1.6l5.2-5.2" /></S>;
export const IconStop = (p: P) => <S {...p}><rect x="7.5" y="7.5" width="9" height="9" rx="2" /></S>;
export const IconLogout = (p: P) => <S {...p}><path d="M9.5 5.5h-3a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /><path d="M14 8.4 17.6 12 14 15.6M17.2 12H9.4" /></S>;
export const IconDoc = (p: P) => <S {...p}><path d="M6.5 4.5h7L18 9v10.5H6.5z" /><path d="M13.2 4.6V9H17.6M9.2 13h5.6M9.2 16h4" /></S>;
export const IconNote = (p: P) => <S {...p}><rect x="4.5" y="4.5" width="15" height="15" rx="2" /><path d="M8.4 9.2h7.2M8.4 12.4h7.2M8.4 15.6h4.4" /></S>;
export const IconSocio = (p: P) => <S {...p}><path d="m3.8 11.6 3-3 3.4 2.6 2.2-1.8 2.6 2.2 2.4-2.4 2.8 2.6" /><path d="M6.8 8.6 4 11.4l3.2 3.4 2.6-2M17.2 15.2l2.8-3-2.6-2.6" /></S>;
export const IconChevron = (p: P) => <S {...p}><path d="m9.5 6.5 5.5 5.5-5.5 5.5" /></S>;
export const IconCollapse = (p: P) => <S {...p}><path d="M4.5 5.5v13M9.5 12h9M15 8.5 18.5 12 15 15.5" /></S>;
export const IconWelcome = (p: P) => <S {...p}><path d="M12 3.8 14.1 9l5.6.4-4.3 3.7 1.3 5.5L12 15.7 7.3 18.6l1.3-5.5L4.3 9.4 9.9 9z" /></S>;
export const IconAccount = (p: P) => <S {...p}><rect x="4.5" y="6" width="15" height="12" rx="2" /><path d="M4.5 10h15M8 14h3.5" /></S>;
