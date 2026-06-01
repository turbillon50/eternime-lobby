# Eternime Lobby

ETERNIME - Digital Legacy Intelligence.

This repository contains the first functional cinematic onboarding lobby for Eternime: a premium Next.js PWA with a full-screen video atmosphere, glowing ring, WebGL particle layer, interactive onboarding sequence, demo-safe auth entry, and first empty dashboard state.

The dashboard now includes the first foundation for Eternime's intelligence layer: a Master Agent blueprint, a Personal Memory Agent, and a demo semantic vector memory vault per individual. The current implementation runs locally in browser storage for the MVP, with the contracts prepared for a real vector database and persistent user storage.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- React Three Fiber / Three.js
- Clerk-ready authentication UI
- Semantic vector memory scaffolding
- Master Agent / Personal Memory Agent architecture
- PWA manifest and installable app structure

## Intelligence Architecture

Eternime starts with a safe RAG-style memory system instead of training custom models on day one.

- `lib/eternime/master-agent.ts`: central principles, safety rules, and personal-agent contract.
- `lib/eternime/personal-memory-agent.ts`: creates the user's guide state and identity profile.
- `lib/eternime/vector-memory.ts`: demo embedding, semantic search, and memory record creation.
- `components/memory/memory-universe-console.tsx`: first UI for encoding memories and watching avatar readiness grow.

Future production storage should replace browser localStorage with isolated per-user persistence:

- raw memories
- semantic memory fragments
- vector embeddings
- identity profile
- relationships
- timeline events
- legacy permissions
- avatar readiness stages

## Install

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and add Clerk keys when available:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
OPENAI_API_KEY=
VECTOR_DATABASE_URL=
```

If Clerk keys are missing, the lobby automatically shows demo mode auth instead of breaking.

## Replacing The Cinematic Video

Place the final 20-second Eternime lobby video at:

```text
public/videos/eternime-lobby.mp4
```

Keep the same filename to avoid code changes. The video layer is configured for autoplay, muted playback, looping, mobile `playsInline`, full-screen `object-cover`, and dark overlays for interface readability.

## Production Build

```bash
npm run build
npm run start
```

## Deploy To Vercel

```bash
vercel --prod
```

Vercel will detect the Next.js app automatically. Configure Clerk environment variables in Vercel Project Settings when real authentication is enabled.
