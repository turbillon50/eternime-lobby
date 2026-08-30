import { NextResponse } from "next/server";
import { auditMcp, type McpAccess, type McpScope } from "@/lib/data/mcp-access";
import { findUserById } from "@/lib/data/users";
import { searchMemories, storeMemoryEmbedding } from "@/lib/ai/rag";
import { createMemory, getMemory, updateMemory } from "@/lib/data/memories";
import { createProject, createTask, listProjects, listTasks, updateProject, updateTask } from "@/lib/data/operations";
import { addNetworkSkill, listNetworkPeople, upsertNetworkPerson } from "@/lib/data/network";

type Rpc = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
};

const CREATE_ONLY = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
};

const UPDATE_ONLY = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

function requiredText(value: unknown, field: string, max: number) {
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
  const clean = value.trim();
  if (!clean) throw new Error(`${field} is required`);
  return Array.from(clean).slice(0, max).join("");
}

function optionalText(value: unknown, field: string, max: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") throw new Error(`${field} must be a string or null`);
  const clean = Array.from(value.trim()).slice(0, max).join("");
  return clean || null;
}

function requiredId(value: unknown, field = "id") {
  const id = requiredText(value, field, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error(`${field} must be a valid UUID`);
  }
  return id;
}

function optionalDate(value: unknown) {
  if (value === undefined || value === null || value === "") return value === undefined ? undefined : null;
  if (typeof value !== "string") throw new Error("due_at must be an ISO date string or null");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("due_at must be a valid date");
  return date.toISOString();
}

function priority(value: unknown) {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 3) throw new Error("priority must be 1, 2 or 3");
  return parsed;
}

function rpc(id: Rpc["id"], result: unknown) {
  return NextResponse.json(
    { jsonrpc: "2.0", id: id ?? null, result },
    { headers: { "Cache-Control": "no-store" } },
  );
}

function rpcError(id: Rpc["id"], code: number, message: string) {
  return NextResponse.json(
    { jsonrpc: "2.0", id: id ?? null, error: { code, message } },
    {
      status: code === -32600 || code === -32700 ? 400 : 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

function has(access: McpAccess, scope: McpScope) {
  return access.scopes.includes(scope);
}

function availableTools(access: McpAccess) {
  const result: Array<Record<string, unknown>> = [];
  if (has(access, "identity.read")) {
    result.push({
      name: "identity_get",
      description: "Read the user's authorized Eternime identity profile.",
      inputSchema: { type: "object", properties: {} },
      annotations: READ_ONLY,
    });
  }
  if (has(access, "memory.read")) {
    result.push({
      name: "memory_search",
      description: "Search the user's Eternime memory semantically. Returns only relevant memories, not the full archive.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number", minimum: 1, maximum: 10 },
        },
        required: ["query"],
      },
      annotations: READ_ONLY,
    });
  }
  if (has(access, "memory.write")) {
    result.push({
      name: "memory_save",
      description: "Save a new text memory in Eternime when the user explicitly asks to remember or save something. This never deletes content.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", maxLength: 180 },
          content: { type: "string", maxLength: 12000 },
          emotional_tone: { type: "string", maxLength: 80 },
        },
        required: ["title", "content"],
        additionalProperties: false,
      },
      annotations: CREATE_ONLY,
    });
    result.push({
      name: "memory_update",
      description: "Update one existing Eternime memory by its id after the user explicitly asks for the change. This never deletes content.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string", maxLength: 180 },
          content: { type: ["string", "null"], maxLength: 12000 },
          emotional_tone: { type: ["string", "null"], maxLength: 80 },
        },
        required: ["id"],
        additionalProperties: false,
      },
      annotations: UPDATE_ONLY,
    });
  }
  if (has(access, "projects.read")) {
    result.push({
      name: "projects_list",
      description: "List the user's active Eternime projects.",
      inputSchema: { type: "object", properties: {} },
      annotations: READ_ONLY,
    });
  }
  if (has(access, "projects.write")) {
    result.push({
      name: "project_create",
      description: "Create a project in Eternime when the user asks to start or save a project. This never deletes projects.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", maxLength: 160 },
          description: { type: "string", maxLength: 4000 },
        },
        required: ["name"],
        additionalProperties: false,
      },
      annotations: CREATE_ONLY,
    });
    result.push({
      name: "project_update",
      description: "Update an existing Eternime project by id. Allowed statuses are active and archived. This never deletes projects.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", maxLength: 160 },
          description: { type: ["string", "null"], maxLength: 4000 },
          status: { type: "string", enum: ["active", "archived"] },
        },
        required: ["id"],
        additionalProperties: false,
      },
      annotations: UPDATE_ONLY,
    });
  }
  if (has(access, "tasks.read")) {
    result.push({
      name: "tasks_list",
      description: "List the user's Eternime tasks and due dates.",
      inputSchema: {
        type: "object",
        properties: { status: { type: "string" } },
      },
      annotations: READ_ONLY,
    });
  }
  if (has(access, "tasks.write")) {
    result.push({
      name: "task_create",
      description: "Create a pending task in Eternime when the user asks to remember a commitment or todo. This never deletes tasks.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", maxLength: 220 },
          notes: { type: "string", maxLength: 4000 },
          project_id: { type: ["string", "null"], format: "uuid" },
          priority: { type: "integer", minimum: 1, maximum: 3 },
          due_at: { type: ["string", "null"], description: "ISO 8601 date/time with timezone, or null." },
        },
        required: ["title"],
        additionalProperties: false,
      },
      annotations: CREATE_ONLY,
    });
    result.push({
      name: "task_update",
      description: "Update or mark an Eternime task done by id. Allowed statuses are open and done. This never deletes tasks.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string", maxLength: 220 },
          status: { type: "string", enum: ["open", "done"] },
          priority: { type: "integer", minimum: 1, maximum: 3 },
          due_at: { type: ["string", "null"], description: "ISO 8601 date/time with timezone, or null." },
        },
        required: ["id"],
        additionalProperties: false,
      },
      annotations: UPDATE_ONLY,
    });
  }
  if (has(access, "network.search")) {
    result.push({
      name: "network_search",
      description: "Search the user's authorized personal network by person, company, relationship, role or skill.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
      annotations: READ_ONLY,
    });
  }
  if (has(access, "network.write")) {
    result.push({
      name: "network_person_save",
      description: "Save a person in Eternime's private network, or update the matching person when the email or phone already exists. This never deletes contacts.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", maxLength: 160 },
          phone: { type: "string", maxLength: 40 },
          email: { type: "string", maxLength: 254 },
          company: { type: "string", maxLength: 160 },
          role: { type: "string", maxLength: 160 },
          relationship: { type: "string", maxLength: 160 },
          skills: { type: "array", items: { type: "string", maxLength: 100 }, maxItems: 20 },
        },
        required: ["name"],
        additionalProperties: false,
      },
      annotations: UPDATE_ONLY,
    });
  }
  return result;
}

async function callTool(access: McpAccess, name: string, args: Record<string, unknown>) {
  if (name === "identity_get" && has(access, "identity.read")) {
    const user = await findUserById(access.user_id);
    if (!user) return {};
    return {
      name: user.name,
      tagline: user.tagline,
      bio: user.bio,
      location: user.location,
      occupation: user.occupation,
      personality_summary: user.personality_summary,
    };
  }
  if (name === "memory_search" && has(access, "memory.read")) {
    const query = String(args.query || "").trim();
    if (!query) return [];
    return (await searchMemories(access.user_id, query, Math.min(10, Math.max(1, Number(args.limit) || 6)))).map((memory) => ({
      id: memory.id,
      title: memory.title,
      content: memory.content,
      kind: memory.kind,
      score: memory.score,
    }));
  }
  if (name === "memory_save" && has(access, "memory.write")) {
    const title = requiredText(args.title, "title", 180);
    const content = requiredText(args.content, "content", 12000);
    const emotionalTone = optionalText(args.emotional_tone, "emotional_tone", 80);
    const memory = await createMemory({
      userId: access.user_id,
      title,
      content,
      kind: "texto",
      emotionalTone,
      source: "mcp",
    });
    if (!memory) throw new Error("Eternime could not save the memory");
    await storeMemoryEmbedding(memory.id, access.user_id, `${title}. ${content}`);
    return { saved: true, memory };
  }
  if (name === "memory_update" && has(access, "memory.write")) {
    const id = requiredId(args.id);
    if (!await getMemory(id, access.user_id)) throw new Error("Memory not found");
    const title = args.title === undefined ? undefined : requiredText(args.title, "title", 180);
    const content = optionalText(args.content, "content", 12000);
    const emotionalTone = optionalText(args.emotional_tone, "emotional_tone", 80);
    if (title === undefined && content === undefined && emotionalTone === undefined) throw new Error("Provide at least one field to update");
    const memory = await updateMemory(id, access.user_id, { title, content, emotionalTone });
    if (!memory) throw new Error("Memory not found");
    await storeMemoryEmbedding(memory.id, access.user_id, `${memory.title}. ${memory.content || ""}`);
    return { updated: true, memory };
  }
  if (name === "projects_list" && has(access, "projects.read")) {
    return (await listProjects(access.user_id)).map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      updated_at: project.updated_at,
    }));
  }
  if (name === "project_create" && has(access, "projects.write")) {
    const project = await createProject(
      access.user_id,
      requiredText(args.name, "name", 160),
      optionalText(args.description, "description", 4000),
    );
    if (!project) throw new Error("Eternime could not create the project");
    return { created: true, project };
  }
  if (name === "project_update" && has(access, "projects.write")) {
    const id = requiredId(args.id);
    const projectName = args.name === undefined ? undefined : requiredText(args.name, "name", 160);
    const description = optionalText(args.description, "description", 4000);
    const status = args.status === undefined ? undefined : requiredText(args.status, "status", 16);
    if (status !== undefined && !["active", "archived"].includes(status)) throw new Error("status must be active or archived");
    if (projectName === undefined && description === undefined && status === undefined) throw new Error("Provide at least one field to update");
    const project = await updateProject(access.user_id, id, { name: projectName, description, status });
    if (!project) throw new Error("Project not found");
    return { updated: true, project };
  }
  if (name === "tasks_list" && has(access, "tasks.read")) {
    const status = String(args.status || "");
    return (await listTasks(access.user_id))
      .filter((task) => !status || task.status === status)
      .map((task) => ({
        id: task.id,
        title: task.title,
        notes: task.notes,
        status: task.status,
        priority: task.priority,
        due_at: task.due_at,
        project: task.project_name,
      }));
  }
  if (name === "task_create" && has(access, "tasks.write")) {
    const projectId = args.project_id === undefined || args.project_id === null ? null : requiredId(args.project_id, "project_id");
    if (projectId && !(await listProjects(access.user_id)).some((project) => project.id === projectId)) throw new Error("Project not found");
    const task = await createTask(access.user_id, {
      title: requiredText(args.title, "title", 220),
      notes: optionalText(args.notes, "notes", 4000),
      projectId,
      priority: priority(args.priority),
      dueAt: optionalDate(args.due_at),
    });
    if (!task) throw new Error("Eternime could not create the task");
    return { created: true, task };
  }
  if (name === "task_update" && has(access, "tasks.write")) {
    const id = requiredId(args.id);
    const title = args.title === undefined ? undefined : requiredText(args.title, "title", 220);
    const status = args.status === undefined ? undefined : requiredText(args.status, "status", 16);
    if (status !== undefined && !["open", "done"].includes(status)) throw new Error("status must be open or done");
    const dueAt = optionalDate(args.due_at);
    const taskPriority = priority(args.priority);
    if (title === undefined && status === undefined && dueAt === undefined && taskPriority === undefined) throw new Error("Provide at least one field to update");
    const task = await updateTask(access.user_id, id, { title, status, dueAt, priority: taskPriority });
    if (!task) throw new Error("Task not found");
    return { updated: true, task };
  }
  if (name === "network_search" && has(access, "network.search")) {
    const query = String(args.query || "").trim().toLowerCase();
    if (!query) return [];
    return (await listNetworkPeople(access.user_id))
      .filter((person) => [person.name, person.email, person.phone, person.company, person.role, person.relationship, ...(person.skills || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query))
      .slice(0, 20)
      .map((person) => ({
        id: person.id,
        name: person.name,
        company: person.company,
        role: person.role,
        relationship: person.relationship,
        skills: person.skills || [],
        confidence: person.confidence,
        visibility: person.visibility,
        source: person.source,
      }));
  }
  if (name === "network_person_save" && has(access, "network.write")) {
    const person = await upsertNetworkPerson({
      userId: access.user_id,
      name: requiredText(args.name, "name", 160),
      phone: optionalText(args.phone, "phone", 40),
      email: optionalText(args.email, "email", 254),
      company: optionalText(args.company, "company", 160),
      role: optionalText(args.role, "role", 160),
      relationship: optionalText(args.relationship, "relationship", 160),
      source: "manual",
      confidence: 1,
    });
    if (!person) throw new Error("Eternime could not save the person");
    const skills = Array.isArray(args.skills)
      ? args.skills.slice(0, 20).map((skill) => requiredText(skill, "skill", 100))
      : [];
    for (const skill of skills) await addNetworkSkill(access.user_id, person.id, skill, "mcp", 1);
    return { saved: true, person: { ...person, skills } };
  }
  throw new Error("Tool not allowed or not found");
}

export function mcpMetadata(endpoint: string, authentication: string) {
  return NextResponse.json(
    {
      name: "Eternime Trust MCP",
      version: "1.2.0",
      endpoint,
      transport: "Streamable HTTP / stateless POST",
      authentication,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function handleMcpPost(request: Request, access: McpAccess) {
  let body: Rpc;
  try {
    body = await request.json() as Rpc;
  } catch {
    return rpcError(null, -32700, "Parse error");
  }

  const method = body.method || "";
  try {
    if (method === "initialize") {
      await auditMcp(access, method, null, true);
      return rpc(body.id, {
        protocolVersion: "2025-06-18",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "Eternime Trust MCP", version: "1.2.0" },
        instructions: "Eternime is the user's private memory layer. Use only the scopes and tools explicitly authorized by the user. Write only when the user asks to save or update something. Deletion is never available through MCP and must happen inside the Eternime app with double verification.",
      });
    }
    if (method === "notifications/initialized") {
      await auditMcp(access, method, null, true);
      return new NextResponse(null, { status: 202 });
    }
    if (method === "tools/list") {
      await auditMcp(access, method, null, true);
      return rpc(body.id, { tools: availableTools(access) });
    }
    if (method === "tools/call") {
      const params = body.params || {};
      const name = String(params.name || "");
      const args = (params.arguments && typeof params.arguments === "object" ? params.arguments : {}) as Record<string, unknown>;
      const result = await callTool(access, name, args);
      await auditMcp(access, method, name, true);
      return rpc(body.id, {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: { data: result },
      });
    }
    if (method === "ping") return rpc(body.id, {});
    return rpcError(body.id, -32601, "Method not found");
  } catch (error) {
    await auditMcp(access, method, String(body.params?.name || "") || null, false).catch(() => {});
    return rpc(body.id, {
      content: [{ type: "text", text: error instanceof Error ? error.message : "Tool error" }],
      isError: true,
    });
  }
}
