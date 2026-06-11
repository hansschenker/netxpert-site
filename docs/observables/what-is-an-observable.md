# What Is an Observable?

The Observable type was not invented for JavaScript. It was born from a mathematical insight at Microsoft: if you have a type that models synchronous, pull-based sequences, its categorical dual must model asynchronous, push-based sequences. That one idea is responsible for every operator, every subscription, and every stream you have ever written in RxJS.

This page covers the conceptual foundation: where Observables come from, what they actually are (a behavior, not a container), the contract they enforce, the cold/hot distinction, and the design patterns and algebra fused inside them.

::: tip Backed by a spec
Every runnable claim on this page is proven in [`specs/observables/observable.spec.ts`](https://github.com/hansschenker/netxpert-site/blob/main/specs/observables/observable.spec.ts).
:::

## The lineage: Haskell → LINQ → Rx.NET → RxJS

The intellectual heritage goes back decades before JavaScript had Promises:

1. **Haskell (1990s)** gave us monads and lazy sequences — the idea that you can *describe* a computation without executing it.
2. **LINQ (2007)** took that idea and built a unified query model: query a database, an in-memory list, or an XML document with the exact same operators, regardless of the underlying source.
3. **Rx.NET (2009–2012)** — Erik Meijer, a Haskell person before joining Microsoft, asked: *if `IEnumerable<T>` models synchronous pull-based sequences, what is its mathematical dual?* The answer is `IObservable<T>`. Rx.NET applied the entire LINQ operator algebra to asynchronous events.
4. **RxJS (early 2010s)** is the JavaScript port of that design — Microsoft's original Rx for JavaScript appeared around 2010, and the library was rewritten from the ground up as RxJS 5 in 2015–2016. Angular adopting it as a core dependency drove massive adoption — but the core model is essentially unchanged from Rx.NET in 2009. That stability is the sign of a genuinely good abstraction.

### One query, five notations

The whole lineage becomes visible in a single example. Take one query — *the numbers from 1 to 10, keeping those greater than 5* — and write it at every historical step.

**Set-builder notation** (mathematics, late 19th-century set theory):

```
{ n | n ∈ {1, …, 10}, n > 5 }
```

A set is described by a *generator* (`n ∈ {1, …, 10}`) and a *predicate* (`n > 5`) — you say what belongs, not how to compute it.

**Haskell list comprehension** (1990):

```haskell
[ n | n <- [1..10], n > 5 ]
```

Almost character-for-character set-builder notation, but now executable — and lazy: the list is only produced as far as someone consumes it.

**LINQ** (C#, 2007):

```csharp
from n in Enumerable.Range(1, 10)
where n > 5
select n
```

The comprehension generalized to *any* data source — `Range(1, 10)` could just as well be a database table or an XML document. Execution is deferred: nothing runs until you enumerate.

**Rx.NET** (C#, 2009):

```csharp
Observable.Range(1, 10)
    .Where(n => n > 5)
    .Subscribe(Console.WriteLine);
```

Same operators, flipped arrows: the values are now *pushed* to the subscriber. Nothing runs until you `Subscribe`.

**RxJS** (TypeScript):

```ts
import { range, filter } from 'rxjs'

range(1, 10).pipe(
  filter(n => n > 5),
).subscribe(n => console.log(n)) // 6 7 8 9 10
```

Five notations spanning more than a century, and the query itself never changed: a generator and a predicate. What changed is the execution model — from a mathematical description, to lazy pull, to deferred queries over any source, to push over time. That is the lineage in one line of code.

### Duality: flip the arrows

"Categorical dual" sounds intimidating, but the practical meaning is simple: **same structure, opposite direction of data flow**.

| Pull (`IEnumerable` / iterator)       | Push (`IObservable` / Observable)     |
| ------------------------------------- | ------------------------------------- |
| Consumer **asks** for values          | Producer **sends** values             |
| Consumer controls timing              | Producer controls timing              |
| `moveNext()` / `next()`               | `next(value)` on the observer         |
| `current` — the value you pull        | the value pushed into `next`          |
| `dispose()`                           | `unsubscribe()`                       |

Every operation maps one-to-one across the duality, which is why the design feels principled rather than arbitrary. The same is true for the operators:

| LINQ (pull)  | RxJS (push) |
| ------------ | ----------- |
| `Select`     | `map`       |
| `Where`      | `filter`    |
| `SelectMany` | `mergeMap`  |
| `Aggregate`  | `reduce` (running variant: `scan`) |

This is why "RxJS is asynchronous LINQ" (or "Lodash for async") is not just a cute analogy — it is architecturally accurate. The operators are the same algebra, applied to a push-based sequence instead of a pull-based one. And it is why async naturally needs push: the network doesn't care about your `for` loop. You can't block and wait — the producer must control timing, and you react when something arrives.

## A behavior, not a container

This is the single most important idea on this page. Most developers first model an Observable as "a fancy array" or "a slow array that arrives over time". That mental model is useful for about five minutes, and then it will break you.

An **array is a data structure**: it stores things, it has a length, you can access index 3 directly. Time is irrelevant — you have the data and inspect it whenever you want.

An **Observable is a behavior**: it stores no values, has no known length, supports no random access, and has *no backing collection at all*. It is a description of how values will be produced over time. Behavior implies **time** (values happen in order, when the producer decides) and **state change** (the world it observes — clicks, sockets, timers — is changing).

> `Observable<T>` ≈ a *script* that produces `T`s over time when someone subscribes — not a *container* of `T`s.

Two analogies that hold up:

- **Recipe vs. meal** — the Observable is the recipe; subscribing cooks the meal.
- **Bucket vs. river** — an array is a bucket: the water is already in there, you can count it, access any drop by index. An Observable is a river: the water is flowing, you don't know how much there is, you cannot go back upstream, and the river exists whether or not you stand on the bank watching it.

Because it makes no assumption about storage, an Observable can represent things that have no collection underneath them at all: mouse moves, WebSocket messages, a heartbeat sensor, a timer, network streams, custom producer logic. **Observable is the universal adapter for data in motion.** Arrays are data at rest; Observables are data in motion.

### The behavior, formally

"Behavior" is not just a metaphor — it has a precise reading, built up in three steps:

```
T → a                          a behavior: the value as a function of time
{t, a}                         one occurrence: a value stamped with its time
[{t₀, a₀}, {t₁, a₁}, …]        an Observable: a sequence of occurrences
```

1. **`T → a`** — a time-varying value is a *function from time*. Ask "what is the value at time t?" and you get an answer. This is the purest sense in which behavior implies time: the value doesn't exist apart from the moment you observe it.
2. **`{t, a}`** — observation discretizes that function into an *occurrence*: a pair of a timestamp and the value at that timestamp.
3. **`[{t₀, a₀}, {t₁, a₁}, …]`** — an Observable is the *sequence of occurrences*: each `next` notification is one pair, in time order, potentially forever.

So an array is `[a₀, a₁, …]` — values with no time axis — while an Observable is `[{t₀, a₀}, {t₁, a₁}, …]` — the same values, but with time as part of the data. That extra dimension is the whole difference, and it is what the [time–value model](#the-time-value-model) below builds on.

## Interfaces as protocols

`IEnumerable<T>` and `IObservable<T>` are interfaces, and an interface is more than "a shape of methods" — it is a **protocol**: the signatures tell you what messages you can send, and the semantics tell you in what order and with what guarantees.

- `IEnumerable<T>` is the **pull protocol**: "you can ask me for an iterator, then repeatedly call `moveNext()` and read `current` until I say I'm done."
- `IObservable<T>` is the **push protocol**: "you can subscribe with an observer, and I will call `next` zero or more times, then eventually `error` or `complete` — and after that I will never call you again."

The interface is the contract; the implementation is free to do anything as long as it respects that contract. Both protocols answer the same question — *how do I talk to a sequence of `T`?* — one pull-based, one push-based.

## The time-value model

As [the formalization above](#the-behavior-formally) showed, an Observable is a sequence of timestamped pairs `[{t₀, a₀}, {t₁, a₁}, …]` — time is a first-class dimension of the data, not an accident of execution.

This explains the operator catalog. Operators split into three classes:

| Operates on…    | Examples                                          |
| --------------- | ------------------------------------------------- |
| **values** (a)  | `map`, `filter`, `scan`, `reduce`                 |
| **time** (t)    | `debounceTime`, `throttleTime`, `delay`, `timeout`, `auditTime` |
| **both**        | `bufferTime`, `windowTime`                        |

When you `debounceTime`, you are not changing the values — you are changing *when they arrive*. Once you see this classification, the operator zoo becomes much less overwhelming, and it doubles as a diagnostic tool: a value bug points at your value operators; a timing bug points at your time operators.

## Laziness: nothing happens until subscribe

An Observable does nothing until subscribed. No HTTP request fires, no timer starts, no event listener attaches. This mirrors Haskell's lazy lists and LINQ's deferred execution — it is a deliberate design choice, not an implementation side effect.

```ts
const pipeline$ = source$.pipe(
  map(parse),
  filter(isValid),
  mergeMap(load),
)
// Nothing has executed. pipeline$ is a blueprint, not a run.

pipeline$.subscribe(render) // NOW the producer starts.
```

Laziness is what makes Observables safe to use *as values*: you can build pipelines, pass them around, and compose them without doing work nobody asked for.

The canonical workflow follows from this — **enter, transform, exit**:

1. **Enter** the reactive world with a creation operator (`fromEvent`, `from`, …).
2. **Transform** the stream with pure operators (`map`, `filter`, `debounceTime`, …).
3. **Exit** at the edge of your application with `subscribe`, where side effects happen — DOM updates, HTTP calls, state changes.

If your operators are pure and your subscriber sits at the edge, the entire transformation pipeline is testable without side effects.

## The observer contract

Every Observable must obey a strict grammar:

```
next* (error | complete)?
```

Zero or more `next` notifications, followed by *either* `error` *or* `complete` — never both, and **never anything after termination**. Those three channels — `next` for values, `error` for terminal failure, `complete` for successful termination — are the only things an Observable can ever communicate.

This sounds bureaucratic, but it is load-bearing for the whole ecosystem:

- `retry` works by resubscribing when it sees an error. If `error` could fire twice, or `next` could fire after `complete`, it would have no idea what to do.
- `switchMap` cancels the previous inner Observable when a new value arrives — that only works if inner Observables terminate cleanly.
- `takeUntil`, `shareReplay`, and essentially every other operator rely on the same guarantees.

The contract also guarantees **deterministic teardown**: when a stream completes or errors, subscriptions are disposed and resources freed. Without it, every operator would have to defensively guard against out-of-order notifications. The contract is what separates a reactive stream from a raw event emitter — it is the constitution of the Observable world.

## Cold vs. hot: temperature

Temperature answers one question: **when does the producer start, relative to subscription?**

- A **cold** Observable starts its producer *on subscribe*. Each subscriber gets its own fresh, independent execution — like calling a function, or ordering a coffee: the barista starts when you order, and the coffee is yours. HTTP requests, `interval`, timers, and async computations are cold.
- A **hot** Observable has a producer that is *already running*, independent of any subscriber — like a radio broadcast or live TV: tune in late and you missed what you missed. Mouse events, WebSocket messages, and Subjects are hot.

::: info Strictly speaking: `fromEvent` is a cold wrapper around a hot source
Each `fromEvent` subscription attaches its *own* listener — per-subscriber execution, which is cold mechanics. What is hot is the *event source*: the mouse moves whether or not anyone subscribes, and values are never replayed. The property that matters in practice — tune in late and you missed what you missed — holds either way.
:::

Temperature is not a property of the data; it is a property of when the producer starts. And it determines three operational things: whether values are replayed for late subscribers, whether subscribers share one execution, and whether timing affects correctness.

### The classic bug

You wrap an HTTP request in a cold Observable and subscribe to it in three places — and you've just made three network calls. This is one of the most common bugs in RxJS. The fix is to **multicast** the execution. `share()` lets all *concurrent* subscribers share a single run — but by default it resets when the source completes, so a subscriber arriving after completion starts a fresh execution (for an HTTP request: a fresh network call). When subscribers can arrive late, `shareReplay(1)` is the robust fix: it shares one execution *and* replays the latest value to late subscribers. But you have to know the temperature distinction exists before you can even diagnose the problem.

## The pattern fusion: Iterator + Observer

The Observable is a fusion of two classic Gang-of-Four patterns (both from 1994), and neither alone is sufficient:

- The **Iterator pattern** contributes lazy evaluation, sequential access, and pull-based consumption.
- The **Observer pattern** contributes push-based notification and decoupled producers/consumers.

The fusion yields something *pull-lazy but push-driven*: nothing happens until you subscribe (the iterator side), but once subscribed, values arrive on the producer's schedule (the observer side). Add the monadic algebra from LINQ on top and you get composition and cancellation too.

No other JavaScript abstraction has the full combination:

| Abstraction      | Lazy | Push | Composable | Cancelable | Multi-value |
| ---------------- | :--: | :--: | :--------: | :--------: | :---------: |
| Promise          |  ✗ (eager)  |  ✓  |  partial  |  ✗  |  ✗ (one)  |
| Event emitter    |  ✗ (hot)    |  ✓  |  ✗  |  awkward  |  ✓  |
| Async iterable   |  ✓  |  ✗ (pull)  |  partial  |  ✓  |  ✓  |
| **Observable**   |  ✓  |  ✓  |  ✓  |  ✓  |  ✓  |

One naming clarification that saves years of confusion: in the classic Observer pattern, the *Observable plays the **subject** role* — it maintains observers and notifies them. The RxJS class literally called `Subject` is a specialized variant (see [the three variants](#the-three-variants) below); the standard Observable is the subject in the pattern-theory sense.

## A monadic algebra

"Observable implements a monadic algebra" is the reason RxJS feels composable instead of ad-hoc. In the practical, programmer sense, a monad is:

1. **A type constructor** — `M<T> = Observable<T>`.
2. **A way to inject a plain value into the context** (*pure* / *return*) — `of(x)` gives an `Observable<T>` that emits `x` and completes.
3. **A way to chain computations that return the same context** (*bind* / *flatMap*) — take an `Observable<T>` and a function `T → Observable<U>`, get an `Observable<U>`. The `mergeMap` / `concatMap` / `switchMap` / `exhaustMap` family are all bind variants, differing only in how they handle concurrency.

These operations obey laws (associativity, left/right identity) — that's what makes it an *algebra*: you can reason about rewrites and refactorings without changing behavior. For example:

```ts
source$.pipe(map(f), map(g))
// is equivalent to
source$.pipe(map(x => g(f(x))))
```

Because async is handled by the same algebra ("for each value, start an async thing that returns an Observable, then flatten"), you get a *calculus for async flows* instead of ad-hoc callbacks: a small set of lawful building blocks that combine predictably. When you write `mergeMap`, you are applying a monadic operator to a push-based sequence whose lineage traces back to Haskell.

## The three variants

RxJS ships three points in the design space:

| Variant                  | Temperature | Cast      | Notes |
| ------------------------ | ----------- | --------- | ----- |
| `Observable`             | cold        | unicast   | Producer starts on subscribe; each subscriber gets its own execution. |
| `ConnectableObservable`  | hot         | multicast | Producer starts on a manual `connect()`; all subscribers share one execution. The class is deprecated in RxJS 7+ — the idea lives on in `connectable()`, `connect`, and `share`/`shareReplay`. |
| `Subject`                | hot         | multicast | Simultaneously an Observable **and** an observer — it has `next`/`error`/`complete` *and* is subscribable. |

The `Subject` is the **escape hatch for bridging the imperative and reactive worlds**: call `subject.next(value)` from imperative code (a callback you can't wrap in `fromEvent`, a legacy API), and every subscriber receives the value. Being hot, late subscribers miss earlier values — unless you use the replay-flavored variants: `BehaviorSubject` (initial value, replays the latest), `ReplaySubject` (replays the last *n*), `AsyncSubject` (emits only the final value, on complete). These get their own section: [Subjects](/subjects/).

## Creation operators: the border crossing

Creation operators are the entry points into the reactive world — adapters that take something from the outside (imperative) world and wrap it in the Observable algebra:

| Operator             | Wraps |
| -------------------- | ----- |
| `of`                 | static values |
| `from`               | arrays, promises, iterables, async iterables |
| `fromEvent`          | DOM events |
| `interval` / `timer` | time |
| `ajax`               | HTTP |
| `webSocket`          | WebSocket connections |
| `defer`              | defers Observable creation until subscription |

### `new Observable` — the assembly language of RxJS

The constructor exposes the raw protocol. You pass a subscriber function; inside it you call `subscriber.next` to emit, `subscriber.error` for terminal failure, `subscriber.complete` for successful termination — and you **return a cleanup function** that runs on unsubscribe:

```ts
const ticks$ = new Observable<number>(subscriber => {
  let n = 0
  const id = setInterval(() => subscriber.next(n++), 1000)
  return () => clearInterval(id) // cleanup — runs on unsubscribe
})
```

That is the entire Observable protocol in four lines. Every creation operator is a convenience wrapper around it; every pipeable operator is a function that takes an Observable and returns a new one using the same protocol internally. Reach for it when nothing built-in fits: callback-based APIs, custom event emitters, domain-specific streams.

The cleanup function is critical. If you wrap a DOM listener, the cleanup removes it; a timer, the cleanup clears it. Forget to return one and the producer keeps running after the subscriber is gone — **the number one cause of memory leaks in RxJS** (alongside forgetting to unsubscribe from hot Observables). The cleanup function is how the *producer* side honors the contract.

## Observable vs. Promise

A Promise is great for a single async value, but it has three fundamental limitations: it is **eager** (starts immediately, can't be deferred), **not cancelable** (once started, it runs to completion whether anyone still cares), and **single-valued**. The Observable solves all three: lazy, cancelable via `unsubscribe`, and zero-to-infinite values over any amount of time.

Functionally, Observable is the strict superset: a Promise is modeled as an Observable that emits exactly one value and completes. The reverse is impossible — you'd lose multiplicity, laziness, and cancelability. (Note one inversion for intuition: a Promise is *multicast* by default — everyone who awaits gets the same result — while a plain Observable is *unicast*. That difference surprises people coming from Promises; it's the temperature discussion again.)

## Why Observable fits JavaScript so well

Observable came from C# and Haskell — yet it fits JavaScript better than the environment it was born in. That's because JavaScript is single-threaded, event-loop-driven, callback-heavy, and async by default: everything in JavaScript is already data in motion — UI events, network responses, timers, sockets. Observable was designed for exactly that world. RxJS doesn't fight JavaScript's async model; it gives it structure — a composable, testable, cancelable algebra over the chaos of callbacks.

And because the design came from a mathematical proof rather than a JavaScript-specific problem, it is durable. Promises arrived, `async/await` arrived, workers and the Streams API arrived — and the Observable algebra stayed relevant, because it isn't tied to a runtime feature. *Mathematics does not deprecate.*

## Takeaways: a diagnostic framework

Four things, and you understand RxJS:

1. **Duality** — Observable is the push-based dual of the iterable; the operator algebra maps one-to-one from LINQ. That is why the API looks the way it does.
2. **The observer contract** — `next* (error|complete)?` is what makes every operator safe to compose.
3. **Temperature** — cold means on-demand and per-subscriber; hot means live and shared. Getting this wrong is the source of most real-world RxJS bugs.
4. **The pattern fusion** — iterator + observer is why Observables are lazy *and* event-driven at once.

And the mental model is diagnostic, not just conceptual:

- Stream emitting after it should have completed? → contract violation somewhere.
- Duplicate side effects (e.g. duplicate HTTP requests)? → cold Observable, multiple subscribers — you need `share`/`shareReplay`.
- Late subscribers missing values? → hot Observable without replay.
- Producer still running after unsubscribe? → missing cleanup function.

The next time you write `new Observable`, ask two questions: *what is my cleanup function doing?* and *is my producer cold or hot?* Those two questions catch most of the bugs that come from misunderstanding Observable design.

The Observable is not a complicated event emitter. It is a mathematically principled, lazily evaluated, push-based sequence that obeys a strict notification contract, can be cold or hot, and fuses two classic design patterns. It was never just a pattern — it was always a proof.
