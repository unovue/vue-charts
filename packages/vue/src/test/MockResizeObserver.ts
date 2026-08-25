/**
 * Spec-faithful ResizeObserver mock for JSDOM.
 *
 * Per the spec, the callback fires once with the element's initial size as
 * soon as observation starts (before the next paint), without any size
 * change. `observe()` reproduces that by reading the target's (usually
 * mocked) getBoundingClientRect and firing synchronously — JSDOM has no
 * rendering pipeline, so the event-loop phase is not simulated.
 *
 * Use `trigger(width, height)` to simulate subsequent size changes, and
 * reset `MockResizeObserver.instances = []` in beforeEach.
 */
export class MockResizeObserver {
  callback: ResizeObserverCallback
  static instances: MockResizeObserver[] = []

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    MockResizeObserver.instances.push(this)
  }

  observe(target: Element) {
    const { width, height } = target.getBoundingClientRect()
    this.trigger(width, height)
  }

  unobserve() {}
  disconnect() {}

  trigger(width: number, height: number) {
    this.callback(
      [{ contentRect: { width, height } } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    )
  }
}
