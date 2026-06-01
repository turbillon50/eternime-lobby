import type { IdentityProfile, MemoryRecord, PersonalAgentState } from "@/lib/eternime/types";

export function createPersonalAgentState(ownerId: string, memories: MemoryRecord[]): PersonalAgentState {
  const identityProfile = synthesizeIdentityProfile(ownerId, memories);

  return {
    ownerId,
    guideMode: memories.length < 3 ? "onboarding" : memories.length < 12 ? "memory-building" : "legacy-synthesis",
    identityProfile,
    memories,
  };
}

export function synthesizeIdentityProfile(ownerId: string, memories: MemoryRecord[]): IdentityProfile {
  const values = collectTags(memories.filter((memory) => memory.kind === "value" || memory.kind === "legacy"));
  const relationships = collectTags(memories.filter((memory) => memory.kind === "relationship"));
  const voice = memories
    .filter((memory) => memory.kind === "voice")
    .flatMap((memory) => memory.text.split(/[.!?]/).map((part) => part.trim()))
    .filter((part) => part.length > 12)
    .slice(0, 4);
  const timeline = memories
    .filter((memory) => memory.kind === "origin" || memory.kind === "turning-point")
    .map((memory) => memory.title)
    .slice(0, 5);

  return {
    ownerId,
    readiness: calculateReadiness(memories),
    dominantValues: values.slice(0, 6),
    voiceSignals: voice,
    knownRelationships: relationships.slice(0, 6),
    timelineSignals: timeline,
    memoryCount: memories.length,
  };
}

export function getNextGuidePrompt(state: PersonalAgentState) {
  if (state.memories.length === 0) {
    return "Tell me about one memory that still feels alive when you close your eyes.";
  }

  if (state.identityProfile.knownRelationships.length < 2) {
    return "Who shaped you most, and what did they teach you without saying it directly?";
  }

  if (state.identityProfile.dominantValues.length < 3) {
    return "What values would you want your future avatar to protect, even when answering difficult questions?";
  }

  if (state.identityProfile.voiceSignals.length < 2) {
    return "Write something the way you would actually say it to someone you love.";
  }

  return "What story should your family be able to ask you about one day?";
}

function calculateReadiness(memories: MemoryRecord[]) {
  const kindCoverage = new Set(memories.map((memory) => memory.kind)).size;
  const emotionalDepth = memories.reduce((sum, memory) => sum + memory.emotionalWeight, 0) / Math.max(memories.length, 1);
  const score = memories.length * 4 + kindCoverage * 8 + emotionalDepth * 3;

  return Math.min(100, Math.round(score));
}

function collectTags(memories: MemoryRecord[]) {
  const counts = new Map<string, number>();
  for (const memory of memories) {
    for (const tag of memory.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}
