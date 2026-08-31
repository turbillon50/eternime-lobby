import "server-only";

import { createMemory } from "@/lib/data/memories";
import { createProject, createTask, listProjects, listTasks } from "@/lib/data/operations";
import { listNetworkPeople } from "@/lib/data/network";
import { backfillMissingMemoryEmbeddings, searchMemories, storeMemoryEmbedding } from "@/lib/ai/rag";
import { createIntegrationSession, isComposioConfigured } from "@/lib/integrations/composio";

export const EON_LIVE_TOOLS = [
  {
    name: "memory_search",
    description: "Busca hechos y recuerdos privados del usuario por significado. Úsala antes de afirmar que recuerdas algo.",
    parametersJsonSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"], additionalProperties: false },
  },
  {
    name: "memory_save",
    description: "Guarda una memoria sólo cuando el usuario lo pide explícitamente con palabras como guarda, recuerda o anota.",
    parametersJsonSchema: { type: "object", properties: { title: { type: "string" }, content: { type: "string" } }, required: ["title", "content"], additionalProperties: false },
  },
  {
    name: "tasks_list",
    description: "Lista pendientes reales del usuario.",
    parametersJsonSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "task_create",
    description: "Crea un pendiente cuando el usuario lo pide explícitamente.",
    parametersJsonSchema: { type: "object", properties: { title: { type: "string" }, notes: { type: "string" }, dueAt: { type: "string", description: "Fecha ISO 8601 opcional" } }, required: ["title"], additionalProperties: false },
  },
  {
    name: "projects_list",
    description: "Lista proyectos reales del usuario.",
    parametersJsonSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "project_create",
    description: "Crea un proyecto cuando el usuario lo pide explícitamente.",
    parametersJsonSchema: { type: "object", properties: { name: { type: "string" }, description: { type: "string" } }, required: ["name"], additionalProperties: false },
  },
  {
    name: "network_search",
    description: "Busca personas en Mi Red por nombre, empresa, rol, relación o habilidad.",
    parametersJsonSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"], additionalProperties: false },
  },
  {
    name: "integrations_status",
    description: "Comprueba qué integraciones externas están conectadas antes de prometer una acción.",
    parametersJsonSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "email_draft_create",
    description: "Crea un borrador de Gmail, nunca lo envía. Antes de llamar, lee destinatario, asunto y resumen y pide confirmación verbal explícita.",
    parametersJsonSchema: { type: "object", properties: { to: { type: "string" }, subject: { type: "string" }, body: { type: "string" }, confirmed: { type: "boolean" } }, required: ["to", "subject", "body", "confirmed"], additionalProperties: false },
  },
] as const;

type ToolContext = { userId: string; clerkId: string };

function textArg(args: Record<string, unknown>, key: string, max = 4000): string {
  return typeof args[key] === "string" ? String(args[key]).trim().slice(0, max) : "";
}

function compact<T>(items: T[], limit = 8): T[] { return items.slice(0, limit); }

function mapEmailDraftInput(schema: Record<string, unknown> | undefined, values: { to: string; subject: string; body: string }) {
  const properties = (schema?.properties && typeof schema.properties === "object")
    ? Object.keys(schema.properties as Record<string, unknown>)
    : [];
  const mapped: Record<string, unknown> = {};
  for (const key of properties) {
    const normalized = key.toLowerCase();
    if (/recipient|to_email|^to$/.test(normalized)) mapped[key] = values.to;
    else if (normalized.includes("subject")) mapped[key] = values.subject;
    else if (/body|content|message/.test(normalized) && !normalized.includes("type")) mapped[key] = values.body;
    else if (normalized === "is_html" || normalized === "html") mapped[key] = false;
  }
  return mapped;
}

async function createEmailDraft(clerkId: string, values: { to: string; subject: string; body: string }) {
  if (!isComposioConfigured()) throw new Error("Las integraciones todavía no están habilitadas.");
  const session = await createIntegrationSession(clerkId, "gmail");
  const connections = await session.toolkits({ toolkits: ["gmail"] });
  if (!connections.items.some((item) => item.connection?.isActive)) {
    throw new Error("Gmail no está conectado. Ábrelo desde Conexiones y privacidad.");
  }
  const found = await session.search({
    query: "Create a Gmail email draft without sending it",
    toolkits: ["gmail"],
  });
  const slug = found.results[0]?.primaryToolSlugs[0];
  if (!slug) throw new Error("Gmail está conectado, pero no encontré la acción de borrador.");
  const input = mapEmailDraftInput(found.toolSchemas[slug]?.inputSchema, values);
  const result = await session.execute(slug, input);
  if (result.error) throw new Error(result.error);
  return { ok: true, action: "draft_created", logId: result.logId };
}

export async function executeEonLiveTool(context: ToolContext, name: string, args: Record<string, unknown>) {
  switch (name) {
    case "memory_search": {
      const query = textArg(args, "query", 1000);
      if (!query) throw new Error("Falta la búsqueda.");
      const memories = await searchMemories(context.userId, query, 6);
      return { memories: memories.map((m) => ({ id: m.id, title: m.title, content: m.content, score: Number(m.score) })) };
    }
    case "memory_save": {
      const title = textArg(args, "title", 160);
      const content = textArg(args, "content", 8000);
      if (!title || !content) throw new Error("Título y contenido son obligatorios.");
      const memory = await createMemory({ userId: context.userId, title, content, kind: "texto", source: "conversacion" });
      if (!memory) throw new Error("No se pudo guardar la memoria.");
      await storeMemoryEmbedding(memory.id, context.userId, `${title}. ${content}`);
      return { ok: true, memory: { id: memory.id, title: memory.title } };
    }
    case "tasks_list": {
      const tasks = (await listTasks(context.userId)).filter((task) => task.status === "open");
      return { tasks: compact(tasks).map(({ id, title, due_at, priority, project_name }) => ({ id, title, dueAt: due_at, priority, project: project_name })) };
    }
    case "task_create": {
      const title = textArg(args, "title", 300);
      if (!title) throw new Error("Falta el título del pendiente.");
      const dueAt = textArg(args, "dueAt", 80) || null;
      if (dueAt && Number.isNaN(Date.parse(dueAt))) throw new Error("La fecha no es válida.");
      const task = await createTask(context.userId, { title, notes: textArg(args, "notes", 1200) || null, dueAt });
      if (!task) throw new Error("No se pudo crear el pendiente.");
      return { ok: true, task: { id: task.id, title: task.title, dueAt: task.due_at } };
    }
    case "projects_list": {
      const projects = (await listProjects(context.userId)).filter((project) => project.status === "active");
      return { projects: compact(projects).map(({ id, name, description }) => ({ id, name, description })) };
    }
    case "project_create": {
      const projectName = textArg(args, "name", 200);
      if (!projectName) throw new Error("Falta el nombre del proyecto.");
      const project = await createProject(context.userId, projectName, textArg(args, "description", 1500) || null);
      if (!project) throw new Error("No se pudo crear el proyecto.");
      return { ok: true, project: { id: project.id, name: project.name } };
    }
    case "network_search": {
      const query = textArg(args, "query", 300).toLocaleLowerCase("es-MX");
      if (!query) throw new Error("Falta la búsqueda.");
      const people = (await listNetworkPeople(context.userId)).filter((person) =>
        [person.name, person.company, person.role, person.relationship, ...(person.skills ?? [])]
          .filter(Boolean).join(" ").toLocaleLowerCase("es-MX").includes(query),
      );
      return { people: compact(people).map(({ id, name: personName, company, role, relationship, skills }) => ({ id, name: personName, company, role, relationship, skills })) };
    }
    case "integrations_status": {
      if (!isComposioConfigured()) return { available: false, connected: [] };
      const session = await createIntegrationSession(context.clerkId);
      const state = await session.toolkits();
      return { available: true, connected: state.items.filter((item) => item.connection?.isActive).map((item) => item.slug) };
    }
    case "email_draft_create": {
      if (args.confirmed !== true) throw new Error("Falta la confirmación explícita del usuario.");
      const values = { to: textArg(args, "to", 320), subject: textArg(args, "subject", 300), body: textArg(args, "body", 12000) };
      if (!values.to || !values.subject || !values.body) throw new Error("Faltan datos del borrador.");
      return createEmailDraft(context.clerkId, values);
    }
    case "memory_reindex":
      return backfillMissingMemoryEmbeddings(context.userId, 24);
    default:
      throw new Error("Acción no permitida.");
  }
}
