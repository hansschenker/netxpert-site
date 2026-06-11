// Proves the claims made in docs/observables/what-is-an-observable.md
import { describe, expect, it } from 'vitest'
import { Observable, fromEvent, of, range, debounceTime, filter, map, mergeMap, share, shareReplay } from 'rxjs'
import { TestScheduler } from 'rxjs/testing'

const scheduler = () =>
  new TestScheduler((actual, expected) => expect(actual).toEqual(expected))

describe('the lineage: one query, five notations', () => {
  it('range(1, 10) filtered to n > 5 is the RxJS spelling of { n | n ∈ {1..10}, n > 5 }', () => {
    const received: number[] = []

    range(1, 10)
      .pipe(filter(n => n > 5))
      .subscribe(n => received.push(n))

    expect(received).toEqual([6, 7, 8, 9, 10])
  })
})

describe('an Observable is a behavior, not a container', () => {
  it('is lazy: the producer does not run until subscribe', () => {
    let producerRuns = 0
    const source$ = new Observable<number>(subscriber => {
      producerRuns++
      subscriber.next(1)
      subscriber.complete()
    })

    const pipeline$ = source$.pipe(map(x => x * 2))
    expect(producerRuns).toBe(0) // blueprint, not a run

    pipeline$.subscribe()
    expect(producerRuns).toBe(1) // subscription is the trigger
  })

  it('runs the cleanup function on unsubscribe', () => {
    let cleanedUp = false
    const source$ = new Observable<number>(() => {
      return () => {
        cleanedUp = true
      }
    })

    const subscription = source$.subscribe()
    expect(cleanedUp).toBe(false)

    subscription.unsubscribe()
    expect(cleanedUp).toBe(true)
  })
})

describe('the observer contract: next* (error | complete)?', () => {
  it('delivers nothing after complete, even if the producer misbehaves', () => {
    const notifications: string[] = []
    const misbehaving$ = new Observable<number>(subscriber => {
      subscriber.next(1)
      subscriber.complete()
      subscriber.next(2) // contract violation — must be silenced
      subscriber.error(new Error('too late')) // also silenced
    })

    misbehaving$.subscribe({
      next: v => notifications.push(`next:${v}`),
      error: () => notifications.push('error'),
      complete: () => notifications.push('complete'),
    })

    expect(notifications).toEqual(['next:1', 'complete'])
  })

  it('delivers nothing after error', () => {
    const notifications: string[] = []
    const misbehaving$ = new Observable<number>(subscriber => {
      subscriber.next(1)
      subscriber.error(new Error('boom'))
      subscriber.next(2) // silenced
      subscriber.complete() // silenced
    })

    misbehaving$.subscribe({
      next: v => notifications.push(`next:${v}`),
      error: () => notifications.push('error'),
      complete: () => notifications.push('complete'),
    })

    expect(notifications).toEqual(['next:1', 'error'])
  })
})

describe('temperature: cold vs hot', () => {
  it('a cold Observable is unicast: each subscriber gets its own execution', () => {
    let executions = 0
    const cold$ = new Observable<number>(subscriber => {
      executions++
      subscriber.next(executions)
      subscriber.complete()
    })

    cold$.subscribe() // "two subscribers, two HTTP requests"
    cold$.subscribe()

    expect(executions).toBe(2)
  })

  it('share() multicasts: all subscribers share one execution', () => {
    let executions = 0
    const cold$ = new Observable<number>(subscriber => {
      executions++
      subscriber.next(executions)
    })

    const shared$ = cold$.pipe(share())
    shared$.subscribe()
    shared$.subscribe()

    expect(executions).toBe(1)
  })

  it('share() resets on complete: a subscriber arriving after completion starts a fresh execution', () => {
    let executions = 0
    const cold$ = new Observable<number>(subscriber => {
      executions++
      subscriber.next(executions)
      subscriber.complete()
    })

    const shared$ = cold$.pipe(share())
    shared$.subscribe() // runs and completes synchronously — the shared connection resets
    shared$.subscribe() // arrives "late", so this is a fresh execution (a fresh network call)

    expect(executions).toBe(2)
  })

  it('fromEvent is a cold wrapper around a hot source: each subscriber attaches its own listener', () => {
    let listeners = 0
    const target = {
      addEventListener: () => { listeners++ },
      removeEventListener: () => { listeners-- },
    }

    const clicks$ = fromEvent(target, 'click')
    const a = clicks$.subscribe()
    const b = clicks$.subscribe()
    expect(listeners).toBe(2) // per-subscriber execution — cold mechanics

    a.unsubscribe()
    b.unsubscribe()
    expect(listeners).toBe(0) // cleanup detaches each listener
  })

  it('shareReplay(1) shares one execution and replays the last value to late subscribers', () => {
    scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
      const source$ = cold('a-b-c|')
      const shared$ = source$.pipe(shareReplay(1))

      // First subscriber sees the full sequence.
      expectObservable(shared$).toBe('a-b-c|')
      // A mid-stream subscriber gets the latest value replayed on arrival,
      // then the live tail.
      expectObservable(shared$, '---^').toBe('---bc|')
      // A subscriber arriving after completion still gets the last value.
      expectObservable(shared$, '------^').toBe('------(c|)')

      // All three shared a single source execution.
      expectSubscriptions(source$.subscriptions).toBe('^----!')
    })
  })
})

describe('the time–value model: operators on the t dimension', () => {
  it('debounceTime changes when values arrive, not the values themselves', () => {
    scheduler().run(({ cold, expectObservable, time }) => {
      const source$ = cold('ab 8ms c|')
      const t = time('      --|') // 2ms debounce window

      // a is discarded (b arrived within the window); b survives, emitted
      // 2ms after it occurred; c is flushed when the source completes.
      // The values are untouched — only their position on the t axis changed.
      expectObservable(source$.pipe(debounceTime(t))).toBe('3ms b 7ms (c|)')
    })
  })
})

describe('Observable vs Promise', () => {
  it('a Promise is eager, an Observable is lazy', () => {
    let promiseRuns = 0
    let observableRuns = 0

    new Promise<number>(resolve => {
      promiseRuns++
      resolve(1)
    })
    const source$ = new Observable<number>(subscriber => {
      observableRuns++
      subscriber.next(1)
      subscriber.complete()
    })

    expect(promiseRuns).toBe(1) // ran at construction — nobody even asked
    expect(observableRuns).toBe(0) // waits for a subscriber

    source$.subscribe()
    expect(observableRuns).toBe(1)
  })

  it('a Promise is single-valued: extra resolutions are ignored', async () => {
    const p = new Promise<number>(resolve => {
      resolve(1)
      resolve(2) // ignored — a promise settles exactly once
    })

    expect(await p).toBe(1)
  })

  it('a Promise is multicast by default, a plain Observable is unicast', async () => {
    let promiseRuns = 0
    const p = new Promise<number>(resolve => {
      promiseRuns++
      resolve(1)
    })
    expect(await Promise.all([p, p])).toEqual([1, 1]) // two consumers...
    expect(promiseRuns).toBe(1) // ...one execution

    let observableRuns = 0
    const cold$ = new Observable<number>(subscriber => {
      observableRuns++
      subscriber.next(observableRuns)
      subscriber.complete()
    })
    cold$.subscribe() // two subscribers...
    cold$.subscribe()
    expect(observableRuns).toBe(2) // ...two executions
  })
})

describe('the monadic algebra', () => {
  it('map fusion: pipe(map(f), map(g)) ≡ pipe(map(g ∘ f))', () => {
    scheduler().run(({ cold, expectObservable }) => {
      const f = (x: string) => x.toUpperCase()
      const g = (x: string) => `<${x}>`
      const values = { a: '<A>', b: '<B>' }

      const chained$ = cold('a-b|').pipe(map(f), map(g))
      const fused$ = cold('  a-b|').pipe(map(x => g(f(x))))

      expectObservable(chained$).toBe('a-b|', values)
      expectObservable(fused$).toBe('a-b|', values)
    })
  })

  it('left identity: of(x).pipe(mergeMap(f)) ≡ f(x)', () => {
    scheduler().run(({ cold, expectObservable }) => {
      const f = (x: string) => cold('x-y|', { x: `${x}1`, y: `${x}2` })
      const values = { x: 'a1', y: 'a2' }

      expectObservable(of('a').pipe(mergeMap(f))).toBe('x-y|', values)
      expectObservable(f('a')).toBe('x-y|', values)
    })
  })

  it('of(x) is "pure": injects a plain value and completes', () => {
    scheduler().run(({ expectObservable }) => {
      expectObservable(of('a')).toBe('(a|)')
    })
  })
})
