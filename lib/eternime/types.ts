export type MemoryKind =
  | "origin"
  | "relationship"
  | "value"
  | "turning-point"
  | "voice"
  | "legacy";

export type MemorySensitivity = "private" | "family" | "legacy";

export type MemoryRecord = {
  id: string;
  ownerId: string;
  kind: MemoryKind;
  title: string;
  text: string;
  emotionalWeight: number;
  sensitivity: MemorySensitivity;
  tags: string[];
  embedding: number[];
  embeddingModel: string;
  embeddingProvider: "local" | "openai";
  createdAt: string;
};

export type IdentityProfile = {
  ownerId: string;
  readiness: number;
  dominantValues: string[];
  voiceSignals: string[];
  knownRelationships: string[];
  timelineSignals: string[];
  memoryCount: number;
};

export type MasterAgentDirective = {
  name: "Eternime Master Intelligence";
  mission: string;
  principles: string[];
  forbiddenBehaviors: string[];
  personalAgentContract: string[];
};

export type PersonalAgentState = {
  ownerId: string;
  guideMode: "onboarding" | "memory-building" | "legacy-synthesis";
  identityProfile: IdentityProfile;
  memories: MemoryRecord[];
};
