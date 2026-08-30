import { NextResponse } from "next/server";
import { auditMcp, type McpAccess, type McpScope } from "@/lib/data/mcp-access";
import { findUserById } from "@/lib/data/users";
import { searchMemories } from "@/lib/ai/rag";
import { listProjects, listTasks } from "@/lib/data/operations";
import { listNetworkPeople } from "@/lib/data/network";

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
  if (has(access, "projects.read")) {
    result.push({
      name: "projects_list",
      description: "List the user's active Eternime projects.",
      inputSchema: { type: "object", properties: {} },
      annotations: READ_ONLY,
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
  if (name === "projects_list" && has(access, "projects.read")) {
    return (await listProjects(access.user_id)).map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      updated_at: project.updated_at,
    }));
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
  throw new Error("Tool not allowed or not found");
}

export function mcpMetadata(endpoint: string, authentication: string) {
  return NextResponse.json(
    {
      name: "Eternime Trust MCP",
      version: "1.1.0",
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
        serverInfo: { name: "Eternime Trust MCP", version: "1.1.0" },
        instructions: "Eternime is the user's private memory layer. Use only the scopes and tools explicitly authorized by the user.",
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
        structuredContent: result,
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
