---
layout: home

hero:
  name: RxJS Knowledge Base
  text: My reactive programming knowledge, in one place
  tagline: Built incrementally, session by session — everything here aims to be executable, every claim backed by a spec.
  actions:
    - theme: brand
      text: Start with Observables
      link: /observables/
    - theme: alt
      text: Browse Patterns
      link: /patterns/

features:
  - title: Observables
    details: The core primitive — creation, cold vs hot, lifecycle.
    link: /observables/
  - title: Operators
    details: Pipeable operators — transformation, filtering, combination, flattening, error handling.
    link: /operators/
  - title: Observers
    details: The consumer side — next, error, complete, and partial observers.
    link: /observers/
  - title: Subscriptions
    details: Managing the lifecycle — teardown logic and unsubscribe strategies.
    link: /subscriptions/
  - title: Subjects
    details: Subject, BehaviorSubject, ReplaySubject, AsyncSubject — and multicasting.
    link: /subjects/
  - title: Schedulers
    details: Controlling when and where work happens — async, queue, animationFrame.
    link: /schedulers/
  - title: Custom Operators
    details: Building your own operators from existing pieces or from scratch.
    link: /custom-operators/
  - title: TypeScript
    details: Typing reactive code well — generics, inference, narrowing in streams.
    link: /typescript/
  - title: Patterns
    details: Real-world recipes — typeahead, polling, caching, state management.
    link: /patterns/
  - title: Tools
    details: The ecosystem around RxJS — devtools, visualizers, helper libraries.
    link: /tools/
  - title: Testing
    details: TestScheduler and marble tests — documentation that proves itself.
    link: /testing/
  - title: Debugging
    details: Seeing inside streams — tap, logging operators, inspection techniques.
    link: /debugging/
---

## Learning path

If reading front to back, follow this order:

1. [Observables](/observables/) — what a stream is
2. [Observers](/observers/) & [Subscriptions](/subscriptions/) — consuming and lifecycle
3. [Operators](/operators/) — transforming streams
4. [Subjects](/subjects/) — multicasting
5. [Schedulers](/schedulers/) — timing and execution context
6. [Custom Operators](/custom-operators/) & [TypeScript](/typescript/) — going deeper
7. [Patterns](/patterns/) — putting it all together
8. [Testing](/testing/), [Debugging](/debugging/) & [Tools](/tools/) — the craft

## Recently added

- *2026-06-10* — Knowledge base scaffolded with the twelve core sections.
