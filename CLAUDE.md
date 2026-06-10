# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A vanilla TypeScript + Vite site (no framework). Currently the Vite starter template: `index.html` mounts `#app`, and `src/main.ts` renders the page by setting `innerHTML` and wiring up DOM behavior (e.g. `setupCounter` from `src/counter.ts`). Static assets served as-is live in `public/`; imported assets live in `src/assets/`.

## Commands

- `npm run dev` — start the Vite dev server (HMR)
- `npm run build` — type-check with `tsc`, then `vite build`
- `npm run preview` — serve the production build locally
- `npx vitest run <file>` — run tests (vitest is installed, but no tests or vitest config exist yet)

There is no lint setup; `tsc` (via `npm run build`) is the only check.

## Notes

- `tsconfig.json` uses `noEmit`, bundler module resolution, `verbatimModuleSyntax`, and `erasableSyntaxOnly` — avoid TS-only runtime syntax like enums and parameter properties; type-only imports must use `import type`.
- `rxjs` and `vitepress` are declared as dependencies but are not used anywhere yet.
- This directory is not a git repository.
