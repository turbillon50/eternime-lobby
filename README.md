# Eternime Lobby

ETERNIME — Digital Legacy Intelligence.

This repository contains the first functional cinematic onboarding lobby for Eternime: a premium Next.js PWA with a full-screen video atmosphere, glowing ring, WebGL particle layer, interactive onboarding sequence, demo-safe auth entry, and first empty dashboard state.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- React Three Fiber / Three.js
- Clerk-ready authentication UI
- PWA manifest and installable app structure

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
