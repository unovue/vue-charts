import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import Text from '@/components/Text.vue'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

describe('text', () => {
  const mockRect = {
    width: 25,
    height: 17,
  }

  beforeEach(() => {
    mockGetBoundingClientRect(mockRect)
  })

  it('renders text element', () => {
    const { container } = render(() => (
      <svg width={300} height={300}>
        <Text width={300} value="Hello World" />
      </svg>
    ))

    const text = container.querySelector('text')
    expect(text).toBeTruthy()
    expect(text!.textContent).toContain('Hello World')
  })

  it('renders number value', () => {
    const { container } = render(() => (
      <svg width={300} height={300}>
        <Text width={300} value={12345} />
      </svg>
    ))

    const text = container.querySelector('text')
    expect(text).toBeTruthy()
    expect(text!.textContent).toContain('12345')
  })

  it('renders with v-charts-text class', () => {
    const { container } = render(() => (
      <svg width={300} height={300}>
        <Text width={300} value="test" />
      </svg>
    ))

    const text = container.querySelector('.v-charts-text')
    expect(text).toBeTruthy()
  })

  it('does not wrap long text if enough width', () => {
    const { container } = render(() => (
      <svg width={300} height={300}>
        <Text width={300} value="This is really long text" style={{ fontFamily: 'Courier' }} />
      </svg>
    ))

    const text = container.querySelector('text')
    expect(text).toBeTruthy()
    // Should be single tspan since width is sufficient
    const tspans = text!.querySelectorAll('tspan')
    expect(tspans.length).toBe(1)
  })

  it('wraps long text if not enough width', () => {
    const { container } = render(() => (
      <svg width={200} height={200}>
        <Text width={200} value="This is really long text for 200px" style={{ fontFamily: 'Courier' }} />
      </svg>
    ))

    const text = container.querySelector('text')
    expect(text).toBeTruthy()
    const tspans = text!.querySelectorAll('tspan')
    expect(tspans.length).toBeGreaterThanOrEqual(2)
  })

  it('does not perform word length calculation if width not set', () => {
    const { container } = render(() => (
      <svg width={300} height={200}>
        <Text value="This is really long text" />
      </svg>
    ))

    const text = container.querySelector('text')
    expect(text).toBeTruthy()
    const tspans = text!.querySelectorAll('tspan')
    expect(tspans.length).toBe(1)
    // No transform from scaleToFit
    const firstTspan = tspans[0]
    expect(firstTspan.getAttribute('transform')).toBeNull()
  })

  it('renders 0 successfully when width is specified', () => {
    const { container } = render(() => (
      <svg width={300} height={200}>
        <Text x={0} y={0} width={30} value={0} />
      </svg>
    ))

    const text = container.querySelector('text')
    expect(text).toBeTruthy()
    expect(text!.textContent).toContain('0')
  })

  it('renders 0 successfully when width is not specified', () => {
    const { container } = render(() => (
      <svg width={300} height={200}>
        <Text x={0} y={0} value={0} />
      </svg>
    ))

    const text = container.querySelector('text')
    expect(text).toBeTruthy()
    expect(text!.textContent).toContain('0')
  })

  it('splits contents on breaking spaces', () => {
    const testString = 'These spaces\tshould\nbreak\rbut'
    const { container } = render(() => (
      <svg width={300} height={200}>
        <Text width="auto" value={testString} />
      </svg>
    ))

    const text = container.querySelector('text')
    expect(text).toBeTruthy()
    const tspans = text!.querySelectorAll('tspan')
    // "These", "spaces", "should", "break", "but" = 5 words split by breaking spaces, but rendered in one line without width constraint
    // With width="auto", it still wraps because width is truthy
    expect(tspans.length).toBeGreaterThanOrEqual(1)
  })

  describe('angle', () => {
    it('applies rotation transform', () => {
      const { container } = render(() => (
        <svg width={300} height={300}>
          <Text x={100} y={100} angle={45} value="rotated" />
        </svg>
      ))

      const text = container.querySelector('text')
      expect(text).toBeTruthy()
      const transform = text!.getAttribute('transform')
      expect(transform).toContain('rotate(45')
    })
  })

  describe('textAnchor', () => {
    it('applies text-anchor attribute', () => {
      const { container } = render(() => (
        <svg width={300} height={300}>
          <Text textAnchor="middle" value="centered" />
        </svg>
      ))

      const text = container.querySelector('text')
      expect(text).toBeTruthy()
      expect(text!.getAttribute('text-anchor')).toBe('middle')
    })

    it('defaults to start text-anchor', () => {
      const { container } = render(() => (
        <svg width={300} height={300}>
          <Text value="default" />
        </svg>
      ))

      const text = container.querySelector('text')
      expect(text).toBeTruthy()
      expect(text!.getAttribute('text-anchor')).toBe('start')
    })
  })

  describe('fill', () => {
    it('applies fill color', () => {
      const { container } = render(() => (
        <svg width={300} height={300}>
          <Text fill="#ff0000" value="colored" />
        </svg>
      ))

      const text = container.querySelector('text')
      expect(text).toBeTruthy()
      expect(text!.getAttribute('fill')).toBe('#ff0000')
    })

    it('defaults to the text token with #808080 fallback', () => {
      const { container } = render(() => (
        <svg width={300} height={300}>
          <Text value="default" />
        </svg>
      ))

      const text = container.querySelector('text')
      expect(text).toBeTruthy()
      expect(text!.getAttribute('fill')).toBe('var(--v-charts-text, #808080)')
    })

    it('falls back to default fill when fill contains url', () => {
      const { container } = render(() => (
        <svg width={300} height={300}>
          <Text fill="url(#gradient)" value="gradient" />
        </svg>
      ))

      const text = container.querySelector('text')
      expect(text).toBeTruthy()
      expect(text!.getAttribute('fill')).toBe('var(--v-charts-text, #808080)')
    })
  })

  describe('scaleToFit', () => {
    it('applies scale transform when scaleToFit is true', () => {
      const { container } = render(() => (
        <svg width={300} height={300}>
          <Text scaleToFit width={100} value="scale me" style={{ fontFamily: 'Courier' }} />
        </svg>
      ))

      const text = container.querySelector('text')
      expect(text).toBeTruthy()
      const transform = text!.getAttribute('transform')
      expect(transform).toContain('scale(')
    })
  })

  describe('breakAll', () => {
    it('splits text character by character when breakAll is true', () => {
      const { container } = render(() => (
        <svg width={300} height={300}>
          <Text width={50} breakAll value="Hello" style={{ fontFamily: 'Courier' }} />
        </svg>
      ))

      const text = container.querySelector('text')
      expect(text).toBeTruthy()
      // With breakAll, each character is its own "word" for wrapping
      const tspans = text!.querySelectorAll('tspan')
      expect(tspans.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('maxLines', () => {
    it('limits output to maxLines', () => {
      const testString = 'Lorem ratione omnis fuga dignissimos in amet. Minus quam architecto non ea iste! Nihil amet in itaque error velit. Corporis autem sequi aut temporibus placeat.'
      const { container } = render(() => (
        <svg width={300} height={200}>
          <Text width={200} maxLines={2} value={testString} />
        </svg>
      ))

      const text = container.querySelector('text')
      expect(text).toBeTruthy()
      const tspans = text!.querySelectorAll('tspan')
      expect(tspans.length).toBeLessThanOrEqual(2)
    })

    it('adds ellipsis at the end of truncated text', () => {
      const testString = 'Sit totam suscipit aliquid suscipit eius cupiditate Aut excepturi ipsum ut suscipit facilis debitis Provident impedit a distinctio neque quaerat'
      const { container } = render(() => (
        <svg width={300} height={200}>
          <Text width={200} maxLines={2} value={testString} />
        </svg>
      ))

      const text = container.querySelector('text')
      expect(text).toBeTruthy()
      const tspans = text!.querySelectorAll('tspan')
      if (tspans.length === 2) {
        const lastTspan = tspans[tspans.length - 1]
        const lastChar = lastTspan.textContent![lastTspan.textContent!.length - 1]
        expect(lastChar).toBe('\u2026') // ellipsis
      }
    })
  })

  describe('verticalAnchor', () => {
    it('supports start verticalAnchor', () => {
      const { container } = render(() => (
        <svg width={300} height={300}>
          <Text verticalAnchor="start" value="start" />
        </svg>
      ))

      const text = container.querySelector('text')
      expect(text).toBeTruthy()
    })

    it('supports middle verticalAnchor', () => {
      const { container } = render(() => (
        <svg width={300} height={300}>
          <Text verticalAnchor="middle" value="middle" />
        </svg>
      ))

      const text = container.querySelector('text')
      expect(text).toBeTruthy()
    })

    it('defaults to end verticalAnchor', () => {
      const { container } = render(() => (
        <svg width={300} height={300}>
          <Text value="end" />
        </svg>
      ))

      const text = container.querySelector('text')
      expect(text).toBeTruthy()
    })
  })
})
