// Integration-only adapter. The runner injects two empty databases on a QA
// branch. This file is never imported by application code.
export async function getCloneSql(person: string) {
  const connection = person === "test-a" ? process.env.TEST_DATABASE_URL_A : person === "test-b" ? process.env.TEST_DATABASE_URL_B : undefined;
  if (!connection) throw new Error("Missing isolated test database");
  const url = new URL(connection);
  if (!/^\/qa_clone_[ab]$/.test(url.pathname)) throw new Error("Only QA clone databases may run this integration test");
  return async (strings: TemplateStringsArray, ...params: unknown[]) => {
    const query = strings.reduce((result, part, i) => result + (i ? `$${i}` : "") + part, "");
    const response = await fetch(`https://${url.hostname}/sql`, {
      method: "POST", headers: { "Content-Type": "application/json", "Neon-Connection-String": connection, "Neon-Raw-Text-Output": "false", "Neon-Array-Mode": "false" },
      body: JSON.stringify({ query, params }),
    });
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error("QA query failed"), { code: data.code });
    return data.rows;
  };
}
