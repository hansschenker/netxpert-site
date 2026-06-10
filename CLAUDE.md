# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

An RxJS knowledge base built incrementally across sessions (see STRUCTURE-PROPOSAL.md for the full vision). Three pillars:

- `docs/` — VitePress site, the main product. Twelve sections, one per major RxJS component: observables, operators, observers, subscriptions, subjects, schedulers, custom-operators, typescript, patterns, tools, testing, debugging. Each new topic becomes a markdown page in its section; the sidebar lives in `docs/.vitepress/config.ts`.
- `specs/` — Vitest marble specs (`TestScheduler`) mirroring the docs structure; every concept page should have a spec that proves its claims.
- `src/` — vanilla TS + Vite playground app for interactive browser demos (still the starter counter template).

Workflow convention: when exploring an RxJS topic, the result is a docs page + a matching spec (+ optionally a playground demo) — grow the knowledge structure rather than leaving loose experiments. Add new pages to the sidebar config and to the "Recently added" list on `docs/index.md`.

## Commands

- `npm run dev` — VitePress dev server for the knowledge base
- `npm run build` / `npm run preview` — build/preview the VitePress site
- `npm test` — run vitest; `npx vitest run <file>` for a single spec
- `npm run play` — Vite dev server for the playground app; `npm run play:build` type-checks (`tsc`) and builds it

There is no lint setup; `tsc` (via `npm run play:build`) is the only check for `src/`.

## Notes

- `tsconfig.json` uses `noEmit`, bundler module resolution, `verbatimModuleSyntax`, and `erasableSyntaxOnly` — avoid TS-only runtime syntax like enums and parameter properties; type-only imports must use `import type`.
- `rxjs` and `vitepress` are declared as dependencies but are not used anywhere yet.
