import { getSql } from "@/lib/db";

export type NetworkSource = "manual" | "vcard" | "whatsapp" | "facebook" | "instagram" | "email" | "calendar" | "inferred";
export type NetworkVisibility = "private" | "circle" | "network" | "public";

export type NetworkPerson = {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  role: string | null;
  relationship: string | null;
  source: NetworkSource;
  source_ref: string | null;
  confidence: number;
  visibility: NetworkVisibility;
  created_at: string;
  updated_at: string;
  skills?: string[];
};

async function ensureNetworkSchema() {
  const sql = getSql();
  if (!sql) return null;
  await sql`CREATE TABLE IF NOT EXISTS eternime_network_people (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    company text,
    role text,
    relationship text,
    source text NOT NULL DEFAULT 'manual',
    source_ref text,
    confidence real NOT NULL DEFAULT 1,
    visibility text NOT NULL DEFAULT 'private',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_eternime_network_people_user ON eternime_network_people(user_id)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_eternime_network_people_user_phone ON eternime_network_people(user_id, phone) WHERE phone IS NOT NULL`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_eternime_network_people_user_email ON eternime_network_people(user_id, email) WHERE email IS NOT NULL`;
  await sql`CREATE TABLE IF NOT EXISTS eternime_network_skills (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    person_id uuid NOT NULL REFERENCES eternime_network_people(id) ON DELETE CASCADE,
    skill text NOT NULL,
    evidence_source text NOT NULL DEFAULT 'manual',
    confidence real NOT NULL DEFAULT .7,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, person_id, skill)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS eternime_network_edges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    from_person_id uuid,
    to_person_id uuid NOT NULL REFERENCES eternime_network_people(id) ON DELETE CASCADE,
    relation text NOT NULL DEFAULT 'knows',
    degree smallint NOT NULL DEFAULT 1,
    source text NOT NULL DEFAULT 'manual',
    confidence real NOT NULL DEFAULT .8,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_eternime_network_edges_user ON eternime_network_edges(user_id)`;
  await sql`CREATE TABLE IF NOT EXISTS eternime_consents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    purpose text NOT NULL,
    source text NOT NULL,
    policy_version text NOT NULL,
    granted boolean NOT NULL,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  return sql;
}

function cleanPhone(v?: string | null) {
  const s=(v||"").replace(/[^0-9+]/g,"");
  return s || null;
}
function cleanEmail(v?: string | null){ const s=(v||"").trim().toLowerCase(); return s || null; }

export async function listNetworkPeople(userId:string):Promise<NetworkPerson[]> {
  const sql=await ensureNetworkSchema(); if(!sql) return [];
  const rows=await sql`SELECT p.*, COALESCE(array_agg(s.skill) FILTER (WHERE s.skill IS NOT NULL), '{}') AS skills
    FROM eternime_network_people p LEFT JOIN eternime_network_skills s ON s.person_id=p.id AND s.user_id=p.user_id
    WHERE p.user_id=${userId} GROUP BY p.id ORDER BY p.updated_at DESC`;
  return rows as NetworkPerson[];
}

export async function upsertNetworkPerson(input:{userId:string;name:string;phone?:string|null;email?:string|null;company?:string|null;role?:string|null;relationship?:string|null;source:NetworkSource;sourceRef?:string|null;visibility?:NetworkVisibility;confidence?:number}) {
  const sql=await ensureNetworkSchema(); if(!sql) return null;
  const phone=cleanPhone(input.phone), email=cleanEmail(input.email);
  const existing = phone
    ? await sql`SELECT id FROM eternime_network_people WHERE user_id=${input.userId} AND phone=${phone} LIMIT 1`
    : email ? await sql`SELECT id FROM eternime_network_people WHERE user_id=${input.userId} AND email=${email} LIMIT 1` : [];
  if(existing[0]?.id){
    const rows=await sql`UPDATE eternime_network_people SET name=${input.name}, email=COALESCE(${email},email), phone=COALESCE(${phone},phone), company=COALESCE(${input.company??null},company), role=COALESCE(${input.role??null},role), relationship=COALESCE(${input.relationship??null},relationship), source=${input.source}, source_ref=COALESCE(${input.sourceRef??null},source_ref), confidence=GREATEST(confidence,${input.confidence??.8}), visibility=${input.visibility??"private"}, updated_at=now() WHERE id=${existing[0].id as string} RETURNING *`;
    return rows[0] as NetworkPerson;
  }
  const rows=await sql`INSERT INTO eternime_network_people (user_id,name,phone,email,company,role,relationship,source,source_ref,confidence,visibility) VALUES (${input.userId},${input.name},${phone},${email},${input.company??null},${input.role??null},${input.relationship??null},${input.source},${input.sourceRef??null},${input.confidence??.8},${input.visibility??"private"}) RETURNING *`;
  return rows[0] as NetworkPerson;
}

export async function addNetworkSkill(userId:string, personId:string, skill:string, source="manual", confidence=.7){
  const sql=await ensureNetworkSchema(); if(!sql) return;
  const clean=skill.trim().slice(0,100); if(!clean) return;
  await sql`INSERT INTO eternime_network_skills (user_id,person_id,skill,evidence_source,confidence) VALUES (${userId},${personId},${clean},${source},${confidence}) ON CONFLICT (user_id,person_id,skill) DO UPDATE SET confidence=GREATEST(eternime_network_skills.confidence,EXCLUDED.confidence)`;
}

export async function recordConsent(userId:string,purpose:string,source:string,granted:boolean,metadata:Record<string,unknown>={}){
  const sql=await ensureNetworkSchema(); if(!sql) return;
  await sql`INSERT INTO eternime_consents(user_id,purpose,source,policy_version,granted,metadata) VALUES (${userId},${purpose},${source},${"2026-08-16-network-v1"},${granted},${JSON.stringify(metadata)}::jsonb)`;
}
