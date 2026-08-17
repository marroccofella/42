# Promptus Media Lab

> `RELAX. IT'S ALREADY OVER.`
>
> A rogue application from **[The Library](https://42.uk)** — part of
> *The Freeloader's Guide to the Undeterministic Universe*.

An AI-powered media editing studio. Upload a video, provide a creative prompt, and
watch as Promptus populates your timeline with actionable editing cues — dialogue,
audio, visual and effect markers, colour-coded and sorted onto the timeline.

## Stack

- **React + TypeScript + Vite**, Tailwind CSS
- **Gemini** (`@google/genai`) generates the structured cue list
- **ffmpeg.wasm** for in-browser media handling

## Run locally

**Prerequisites:** Node.js

```bash
npm install
```

Copy `.env.example` to `.env.local` and set your Gemini API key
(get one at https://aistudio.google.com/apikey):

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

You can also paste a key in the app's settings at runtime — it stays in your
browser's localStorage and is never sent anywhere except Google's API.

## Security note

This is a **client-side** app: any API key present at build time is embedded in the
served JavaScript bundle. Deploy with a key only if you accept that, or put the
Gemini call behind a serverless proxy (e.g. a Netlify function) instead.

---

Part of the **42.uk** ecosystem. Explore the rest of [The Library](https://42.uk).
