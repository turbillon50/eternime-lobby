import type { MemoryKind, MemoryRecord, MemorySensitivity } from "@/lib/eternime/types";

const VECTOR_SIZE = 48;
const stopWords = new Set([
  "the",
  "and",
  "that",
  "this",
  "with",
  "para",
  "como",
  "pero",
  "porque",
  "cuando",
  "donde",
  "ella",
  "ellos",
  "ellas",
  "esto",
  "todo",
]);

export function createMemoryRecord(input: {
  ownerId: string;
  kind: MemoryKind;
  title?: string;
  text: string;
  emotionalWeight?: number;
  sensitivity?: MemorySensitivity;
}): MemoryRecord {
  const tags = extractTags(input.text);

  return {
    id: createStableId(input.text),
    ownerId: input.ownerId,
    kind: input.kind,
    title: input.title || inferTitle(input.text),
    text: input.text.trim(),
    emotionalWeight: input.emotionalWeight ?? inferEmotionalWeight(input.text),
    sensitivity: input.sensitivity ?? "private",
    tags,
    embedding: embedSemanticText(input.text),
    createdAt: new Date().toISOString(),
  };
}

export function searchSemanticMemories(query: string, memories: MemoryRecord[]) {
  const queryVector = embedSemanticText(query);

  return memories
    .map((memory) => ({
      memory,
      score: cosineSimilarity(queryVector, memory.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export function embedSemanticText(text: string) {
  const vector = new Array<number>(VECTOR_SIZE).fill(0);
  const tokens = tokenize(text);

  for (const token of tokens) {
    const index = positiveHash(token) % VECTOR_SIZE;
    const weight = stopWords.has(token) ? 0.18 : 1;
    vector[index] += weight;
  }

  return normalize(vector);
}

function cosineSimilarity(a: number[], b: number[]) {
  return a.reduce((score, value, index) => score + value * (b[index] ?? 0), 0);
}

function normalize(vector: number[]) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!magnitude) return vector;
  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

function extractTags(text: string) {
  return Array.from(new Set(tokenize(text).filter((token) => token.length > 4 && !stopWords.has(token)))).slice(0, 8);
}

function inferTitle(text: string) {
  const trimmed = text.trim();
  if (trimmed.length <= 46) return trimmed;
  return `${trimmed.slice(0, 43).trim()}...`;
}

function inferEmotionalWeight(text: string) {
  const lower = text.toLowerCase();
  const signals = ["love", "amor", "miedo", "familia", "madre", "padre", "hijo", "hija", "perdi", "sueno", "legacy", "legado"];
  const matches = signals.filter((signal) => lower.includes(signal)).length;
  return Math.min(10, 3 + matches * 2);
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function positiveHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function createStableId(text: string) {
  return `mem_${positiveHash(`${text}_${Date.now()}`).toString(36)}`;
}
