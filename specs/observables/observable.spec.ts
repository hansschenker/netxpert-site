// Proves the claims made in docs/observables/what-is-an-observable.md
import { describe, expect, it } from 'vitest'
import { Observable, of, debounceTime, map, mergeMap, share } from 'rxjs'
import { TestScheduler } from 'rxjs/testing'

const scheduler = () =>
  new TestScheduler((actual, expected) => expect(actual).toEqual(expected))

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
