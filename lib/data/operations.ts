import { getSql } from "@/lib/db";

export type EonProject = { id:string; user_id:string; name:string; description:string|null; status:string; created_at:string; updated_at:string };
export type EonTask = { id:string; user_id:string; project_id:string|null; title:string; notes:string|null; status:string; priority:number; due_at:string|null; created_at:string; updated_at:string; project_name?:string|null };

async function ensureOperationsSchema() {
  const sql=getSql(); if(!sql) return null;
  await sql`CREATE TABLE IF NOT EXISTS eternime_projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL, name text NOT NULL,
    description text, status text NOT NULL DEFAULT 'active', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_eternime_projects_user ON eternime_projects(user_id, updated_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS eternime_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL,
    project_id uuid REFERENCES eternime_projects(id) ON DELETE SET NULL,
    title text NOT NULL, notes text, status text NOT NULL DEFAULT 'open', priority smallint NOT NULL DEFAULT 2,
    due_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_eternime_tasks_user ON eternime_tasks(user_id, status, due_at)`;
  return sql;
}

export async function listProjects(userId:string):Promise<EonProject[]> { const sql=await ensureOperationsSchema(); if(!sql)return[]; return await sql`SELECT * FROM eternime_projects WHERE user_id=${userId} ORDER BY updated_at DESC` as EonProject[]; }
export async function createProject(userId:string,name:string,description?:string|null):Promise<EonProject|null>{ const sql=await ensureOperationsSchema(); if(!sql)return null; const r=await sql`INSERT INTO eternime_projects(user_id,name,description) VALUES(${userId},${name},${description??null}) RETURNING *`; return (r[0] as EonProject)??null; }
export async function updateProject(userId:string,id:string,patch:{name?:string;description?:string|null;status?:string}):Promise<EonProject|null>{ const sql=await ensureOperationsSchema(); if(!sql)return null; const rows=await sql`UPDATE eternime_projects SET name=COALESCE(${patch.name??null},name), description=CASE WHEN ${patch.description===undefined} THEN description ELSE ${patch.description??null} END, status=COALESCE(${patch.status??null},status), updated_at=now() WHERE id=${id} AND user_id=${userId} RETURNING *`; return (rows[0] as EonProject)??null; }
export async function listTasks(userId:string):Promise<EonTask[]> { const sql=await ensureOperationsSchema(); if(!sql)return[]; return await sql`SELECT t.*,p.name AS project_name FROM eternime_tasks t LEFT JOIN eternime_projects p ON p.id=t.project_id WHERE t.user_id=${userId} ORDER BY CASE WHEN t.status='open' THEN 0 ELSE 1 END, t.due_at NULLS LAST, t.priority DESC, t.created_at DESC` as EonTask[]; }
export async function createTask(userId:string,input:{title:string;notes?:string|null;projectId?:string|null;priority?:number;dueAt?:string|null}):Promise<EonTask|null>{ const sql=await ensureOperationsSchema(); if(!sql)return null; const r=await sql`INSERT INTO eternime_tasks(user_id,title,notes,project_id,priority,due_at) VALUES(${userId},${input.title},${input.notes??null},${input.projectId??null},${input.priority??2},${input.dueAt??null}) RETURNING *`; return (r[0] as EonTask)??null; }
export async function updateTask(userId:string,id:string,patch:{status?:string;title?:string;dueAt?:string|null;priority?:number}):Promise<EonTask|null>{ const sql=await ensureOperationsSchema(); if(!sql)return null; const rows=await sql`UPDATE eternime_tasks SET status=COALESCE(${patch.status??null},status), title=COALESCE(${patch.title??null},title), due_at=CASE WHEN ${patch.dueAt===undefined} THEN due_at ELSE ${patch.dueAt??null} END, priority=COALESCE(${patch.priority??null},priority), updated_at=now() WHERE id=${id} AND user_id=${userId} RETURNING *`; return (rows[0] as EonTask)??null; }
