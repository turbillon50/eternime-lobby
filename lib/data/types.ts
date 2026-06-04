/** Tipos de dominio Eternime (tablas eternime_* en Neon). */

export type EternimeUser = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
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
  emotional_tone: string | null;
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
  created_at: string;
};

export type GuideMessage = {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};
