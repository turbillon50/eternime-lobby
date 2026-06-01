"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { createPersonalAgentState, getNextGuidePrompt } from "@/lib/eternime/personal-memory-agent";
import type { MemoryKind, MemoryRecord } from "@/lib/eternime/types";
import { createMemoryRecord, searchSemanticMemories } from "@/lib/eternime/vector-memory";
import { PrimaryButton, QuietButton } from "@/components/ui/buttons";

const demoOwnerId = "demo-eternime-owner";
const storageKey = "eternime.semanticMemories.v1";
const kinds: Array<{ label: string; value: MemoryKind }> = [
  { label: "Origin", value: "origin" },
  { label: "Relationship", value: "relationship" },
  { label: "Value", value: "value" },
  { label: "Turning Point", value: "turning-point" },
  { label: "Voice", value: "voice" },
  { label: "Legacy", value: "legacy" },
];

export function MemoryUniverseConsole() {
  const [memories, setMemories] = useState<MemoryRecord[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const stored = window.localStorage.getItem(storageKey);
      return stored ? (JSON.parse(stored) as MemoryRecord[]) : [];
    } catch {
      return [];
    }
  });
  const [kind, setKind] = useState<MemoryKind>("origin");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("family love legacy");

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(memories));
  }, [memories]);

  const agentState = useMemo(() => createPersonalAgentState(demoOwnerId, memories), [memories]);
  const semanticResults = useMemo(() => searchSemanticMemories(query, memories), [query, memories]);
  const nextPrompt = getNextGuidePrompt(agentState);

  function addMemory() {
    if (draft.trim().length < 8) return;

    const memory = createMemoryRecord({
      ownerId: demoOwnerId,
      kind,
      text: draft,
    });

    setMemories((current) => [memory, ...current]);
    setDraft("");
    setQuery(memory.tags.slice(0, 3).join(" ") || memory.title);
  }

  return (
    <motion.div
      className="memory-console mt-10 w-full"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="memory-console-header">
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.34em] text-white/38">Master Agent Online</p>
          <h2 className="mt-3 text-2xl font-light text-white sm:text-3xl">Train My Eternime</h2>
        </div>
        <div className="memory-readiness">
          <span>{agentState.identityProfile.readiness}%</span>
          <small>avatar readiness</small>
        </div>
      </div>

      <div className="memory-console-grid">
        <section className="memory-panel memory-panel-main">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-white/34">Personal Memory Agent</p>
          <p className="mt-4 text-left text-lg leading-7 text-white/72">{nextPrompt}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {kinds.map((item) => (
              <button
                className={item.value === kind ? "memory-kind memory-kind-active" : "memory-kind"}
                key={item.value}
                onClick={() => setKind(item.value)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>

          <textarea
            className="memory-textarea"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write one vivid memory, belief, phrase, relationship, or moment..."
            value={draft}
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <PrimaryButton onClick={addMemory}>Encode Memory</PrimaryButton>
            <QuietButton onClick={() => setDraft(nextPrompt)}>Use Guide Prompt</QuietButton>
          </div>
        </section>

        <section className="memory-panel">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-white/34">Semantic Vault</p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-left">
            <Metric label="memories" value={memories.length} />
            <Metric label="mode" value={agentState.guideMode.replace("-", " ")} />
            <Metric label="vectors" value={memories.length ? `${memories.length} active` : "empty"} />
          </div>

          <input
            className="memory-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Semantic search..."
            value={query}
          />

          <div className="mt-4 space-y-3 text-left">
            {semanticResults.length ? (
              semanticResults.map(({ memory, score }) => (
                <article className="memory-result" key={memory.id}>
                  <div className="flex items-center justify-between gap-3">
                    <strong>{memory.title}</strong>
                    <span>{Math.round(score * 100)}%</span>
                  </div>
                  <p>{memory.text}</p>
                </article>
              ))
            ) : (
              <p className="text-sm leading-6 text-white/42">The semantic vault is waiting for its first encoded memory.</p>
            )}
          </div>
        </section>
      </div>

      <section className="memory-profile">
        <ProfileList title="Values" values={agentState.identityProfile.dominantValues} />
        <ProfileList title="Relationships" values={agentState.identityProfile.knownRelationships} />
        <ProfileList title="Voice Signals" values={agentState.identityProfile.voiceSignals} />
        <ProfileList title="Timeline" values={agentState.identityProfile.timelineSignals} />
      </section>
    </motion.div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="memory-metric">
      <span>{value}</span>
      <small>{label}</small>
    </div>
  );
}

function ProfileList({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <p>{title}</p>
      <ul>
        {(values.length ? values : ["Awaiting signal"]).slice(0, 4).map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  );
}
