import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { Animate } from '@/animation/Animate'

describe('animate', () => {
  it('renders with default props (isActive=false sets value to "to")', async () => {
    // Animate passes currentValue (a number) directly to the default slot
    const { container } = render(() => (
      <Animate isActive={false}>
        {
          (t: number) => (
            <div>
              Progress:
              {t}
            </div>
          )
        }
      </Animate>
    ))

    await nextTick()
    // When isActive=false, currentValue is set to props.to (default 1)
    expect(container.textContent).toContain('Progress: 1')
  })

  it('calls onAnimationStart when animation starts', () => {
    const onStart = vi.fn()

    render(() => (
      <Animate isActive={true} onAnimationStart={onStart}>
        {
          (t: number) => (
            <div>
              Progress:
              {t}
            </div>
          )
        }
      </Animate>
    ))

    // onAnimationStart is called synchronously when isActive becomes true
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('starts animation with from=0 and renders initial value', async () => {
    const { container } = render(() => (
      <Animate isActive={true} from={0} to={100}>
        {
          (value: number) => (
            <div>
              Value:
              {Math.round(value)}
            </div>
          )
        }
      </Animate>
    ))

    // Initially animation starts at from=0
    // framer-motion's animate uses RAF which doesn't run in JSDOM,
    // so value stays at 0 (initial currentValue ref)
    expect(container.textContent).toContain('Value: 0')
  })

  it('renders slot with final value when animation is inactive', async () => {
    const { container } = render(() => (
      <Animate from={0} to={100} isActive={false}>
        {
          (value: number) => (
            <div>
              Value:
              {Math.round(value)}
            </div>
          )
        }
      </Animate>
    ))

    await nextTick()
    // When isActive=false, currentValue is set to props.to = 100
    expect(container.textContent).toContain('Value: 100')
  })

  it('completes at the target value, not at 1', async () => {
    const onAnimationEnd = vi.fn()

    const { container } = render(() => (
      <Animate from={0} to={100} isActive={true} onAnimationEnd={onAnimationEnd}>
        {
          (value: number) => (
            <div>
              Value:
              {Math.round(value)}
            </div>
          )
        }
      </Animate>
    ))

    await vi.waitFor(() => {
      expect(onAnimationEnd).toHaveBeenCalledTimes(1)
    })

    // onComplete must set currentValue to props.to (100), not the hardcoded 1
    expect(container.textContent).toContain('Value: 100')
  })

  it('completes at a decreasing target value', async () => {
    const onAnimationEnd = vi.fn()

    const { container } = render(() => (
      <Animate from={80} to={20} isActive={true} onAnimationEnd={onAnimationEnd}>
        {
          (value: number) => (
            <div>
              Value:
              {Math.round(value)}
            </div>
          )
        }
      </Animate>
    ))

    await vi.waitFor(() => {
      expect(onAnimationEnd).toHaveBeenCalledTimes(1)
    })

    expect(container.textContent).toContain('Value: 20')
  })
})
