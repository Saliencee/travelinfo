# Trip Entry Guide

Minimal, fast MVP that helps travelers check entry requirements with a full, free checklist.

## Features

- Quick visa summary + official source links
- Full checklist included on every guide
- Local JSON/TS rules dataset (no backend required)

## Tech stack

- SvelteKit + TypeScript
- Tailwind CSS (v4, Vite plugin)

## Local setup

```bash
npm install
npm run dev
```

### Environment variables

No environment variables are required for the local MVP.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Project structure

```
src/
  lib/
    data/            # Countries + entry rules dataset
  routes/
    +page.svelte     # Landing page
    guide/           # Results + checklist
```

## Notes

- Data is informational only and can change. Always verify official sources.
