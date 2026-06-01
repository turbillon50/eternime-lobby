# Eternime Lobby

ETERNIME - Digital Legacy Intelligence.

This repository contains the first functional cinematic onboarding lobby for Eternime: a premium Next.js PWA with a full-screen video atmosphere, glowing ring, WebGL particle layer, interactive onboarding sequence, demo-safe auth entry, and first dashboard state.

The dashboard now includes the first foundation for Eternime's intelligence layer: a Master Agent blueprint, a Personal Memory Agent, and a semantic vector memory vault per individual. The current implementation is production-safe: it calls OpenAI from server routes when `OPENAI_API_KEY` is present and falls back to local demo embeddings when keys are missing.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- React Three Fiber / Three.js
- Clerk-ready authentication UI
- OpenAI-ready guide and embedding routes
- Master Agent / Personal Memory Agent architecture
- PWA manifest and installable app structure

## Intelligence Architecture

Eternime starts with a safe RAG-style memory system instead of training custom models on day one.

- `lib/eternime/master-agent.ts`: central principles, safety rules, and personal-agent contract.
- `lib/eternime/personal-memory-agent.ts`: creates the user's guide state and identity profile.
- `lib/eternime/openai.ts`: server-only OpenAI connection for guide responses and embeddings.
- `lib/eternime/vector-memory.ts`: local fallback embedding, semantic search, and memory record creation.
- `app/api/eternime/*`: API routes for status, memory encoding, semantic search, and the personal guide.
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

Copy `.env.example` to `.env.local` and add keys when available:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
VECTOR_DATABASE_URL=
```

If Clerk keys are missing, the lobby automatically shows demo mode auth instead of breaking. If `OPENAI_API_KEY` is missing, Eternime keeps the same UI and uses local demo intelligence until the real key is added.

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

Vercel will detect the Next.js app automatically. Configure Clerk and OpenAI environment variables in Vercel Project Settings when real authentication and live intelligence are enabled.
