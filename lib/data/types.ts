/** Tipos de dominio Eternime (tablas eternime_* en Neon). */

export type EternimeUser = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  cover_url: string | null;
  tagline: string | null;
  bio: string | null;
  birthdate: string | null;
  birthplace: string | null;
  location: string | null;
  phone: string | null;
  occupation: string | null;
  socials: Record<string, string> | null;
  prefs: Record<string, unknown> | null;
  locale: string;
  role: "user" | "admin";
  created_at: string;
};

export type MemoryKind = "texto" | "carta" | "voz" | "foto" | "video";

export type Memory = {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  kind: MemoryKind;
  media_url: string | null;
  media_urls: string[] | null;
  emotional_tone: string | null;
  created_at: string;
};

export type FileKind = "image" | "document" | "audio" | "video" | "other";

export type EternimeFile = {
  id: string;
  user_id: string;
  kind: FileKind;
  url: string;
  pathname: string | null;
  name: string | null;
  mime: string | null;
  size: number | null;
  caption: string | null;
  created_at: string;
};

export type LetterStatus = "draft" | "scheduled" | "delivered";

export type Letter = {
  id: string;
  user_id: string;
  recipient_name: string;
  recipient_email: string | null;
  title: string;
  body: string;
  deliver_on: string | null;
  status: LetterStatus;
  created_at: string;
};

export type Beneficiary = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  relationship: string | null;
  is_primary: boolean;
  delivery_condition: string | null;
  invited_at: string | null;
  photo_url: string | null;
  created_at: string;
};

export type GuideMessage = {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};
