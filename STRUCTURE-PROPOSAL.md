# Proposal: netxpert-site as an RxJS Knowledge Hub

*Drafted 2026-06-10 — structure suggestions for turning this repo into the starting
point for all RxJS knowledge built together with Claude.*

## The architecture: three pillars

The dependencies already in `package.json` (`rxjs`, `vitepress`, `vitest`) map onto
three kinds of knowledge, and the site should connect them:

### 1. VitePress — the written knowledge (the core of the site)

Every concept gets a markdown page with explanation, marble-diagram thinking, and
code. VitePress provides sidebar navigation, full-text search, and syntax
highlighting for free — ideal for a knowledge base that grows over months.

### 2. Vitest — knowledge that proves itself

For each concept, write a spec using RxJS's `TestScheduler` with marble syntax.
A test like `expectObservable(result).toBe('--a--b|')` *is* documentation — and
unlike prose, `npm test` tells you when your knowledge is wrong or outdated.
The docs never silently rot.

### 3. The Vite app — interactive playground

Keep `src/` as a small demo app where operators run live in the browser
(click a button, watch `switchMap` cancel the previous request).
Docs pages link to these demos.

## Proposed file structure

*(Implemented 2026-06-10 with the section taxonomy below — one directory per major
RxJS component.)*

```
netxpert-site/
├── docs/                        # VitePress site (the knowledge hub)
│   ├── .vitepress/config.ts     # nav + sidebar
│   ├── index.md                 # ← the starting page
│   ├── observables/             # creation, cold vs hot, lifecycle
│   ├── operators/               # transformation, filtering, flattening,
│   │                            #   combination, error handling, utility
│   ├── observers/               # next / error / complete contract
│   ├── subscriptions/           # teardown, unsubscribe strategies
│   ├── subjects/                # Subject variants, multicasting
│   ├── schedulers/              # async, queue, animationFrame, observeOn
│   ├── custom-operators/        # building your own operators
│   ├── typescript/              # typing reactive code well
│   ├── patterns/                # typeahead, polling, caching, state, decisions
│   ├── tools/                   # devtools, visualizers, helper libraries
│   ├── testing/                 # TestScheduler, marble syntax
│   └── debugging/               # tap, debug operators, silent failures
├── specs/                       # vitest marble specs, mirrors docs/ structure
└── src/                         # interactive playground app
    └── demos/
```

## The starting page (`docs/index.md`)

Structured around how it will actually be used — as both a learning path and a
lookup reference:

1. **Hero** — "My RxJS Knowledge Base" + one-line philosophy
   (e.g. "Everything here is executable — every claim has a spec").
2. **Learning path** — an ordered trail for reading front-to-back:
   Foundations → Operators → Subjects → Patterns → Testing.
3. **Decision guides** — the questions you actually ask while coding:
   - "switchMap, mergeMap, concatMap, or exhaustMap?"
   - "Subject or BehaviorSubject?"
   - "share or shareReplay?"

   These become the most-visited pages of any RxJS reference.
4. **Recipe index** — real-world patterns organized by use case,
   not by operator name.
5. **Recently added** — a short changelog section, so the page reflects that
   this is a growing, living document of our sessions.

## Workflow suggestions

- **One session, one page.** Each time we explore an RxJS topic, it ends as a
  docs page + a spec file + (optionally) a playground demo. The hub grows
  instead of accumulating loose experiments.
- **Deploy via GitHub Pages** with a VitePress GitHub Action, so the knowledge
  base is always readable at `hansschenker.github.io/netxpert-site` without
  running anything locally.

## One structural decision to make now

Make VitePress the *root* experience (the thing `npm run dev` opens) and demote
the current counter app to the playground role — the knowledge base is the
actual product here.

## Proposed first step

Scaffold the skeleton end-to-end so every future session just adds pages:

1. VitePress setup with the starting page and sidebar for the categories above
2. One example concept page (`switchMap`) with its matching marble spec
3. GitHub Pages deploy workflow
