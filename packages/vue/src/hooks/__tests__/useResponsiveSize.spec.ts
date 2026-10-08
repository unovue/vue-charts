import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, reactive, watch } from 'vue'
import { useResponsiveSize as resolveSize } from '@/hooks/useResponsiveSize'
import { mount } from '@vue/test-utils'

function useResponsiveSize(props: Parameters<typeof resolveSize>[0]) {
  let result: ReturnType<typeof resolveSize>
  mount(defineComponent({
    setup() {
      result = resolveSize(props)
      return () => null
    },
  }))
  return result!
}

function createProps(overrides: Partial<{ width: number, height: number }> = {}) {
  return reactive({ width: undefined, height: undefined, ...overrides }) as {
    width?: number
    height?: number
  }
}

describe('useResponsiveSize', () => {
  it('reads width/height from props when not responsive', () => {
    const props = createProps({ width: 400, height: 300 })
    const { effectiveWidth, effectiveHeight, hasValidSize } = useResponsiveSize(props)

    expect(effectiveWidth.value).toBe(400)
    expect(effectiveHeight.value).toBe(300)
    expect(hasValidSize.value).toBe(true)
  })

  it('starts at valid server geometry when props are missing', () => {
    const props = createProps()
    const { hasValidSize } = useResponsiveSize(props)

    expect(hasValidSize.value).toBe(true)
  })

  it('ignores handleResize when not responsive', () => {
    const props = createProps({ width: 400, height: 300 })
    const { effectiveWidth, effectiveHeight, handleResize } = useResponsiveSize(props)

    handleResize(650, 480)

    expect(effectiveWidth.value).toBe(400)
    expect(effectiveHeight.value).toBe(300)
  })

  it('starts at the initial size and takes the measured size from handleResize', () => {
    const props = createProps({})
    const { effectiveWidth, effectiveHeight, hasValidSize, handleResize } = useResponsiveSize(props)

    expect(hasValidSize.value).toBe(true)

    handleResize(500, 300)

    expect(effectiveWidth.value).toBe(500)
    expect(effectiveHeight.value).toBe(300)
    expect(hasValidSize.value).toBe(true)
  })

  it('rounds fractional measured sizes', () => {
    const props = createProps({})
    const { effectiveWidth, effectiveHeight, handleResize } = useResponsiveSize(props)

    handleResize(500.4, 299.6)

    expect(effectiveWidth.value).toBe(500)
    expect(effectiveHeight.value).toBe(300)
  })

  it('dedupes no-change resize notifications', async () => {
    const props = createProps({})
    const { effectiveWidth, handleResize } = useResponsiveSize(props)
    const onChange = vi.fn()
    watch(effectiveWidth, onChange)

    handleResize(650, 480)
    handleResize(650, 480)
    handleResize(650.2, 479.7) // rounds to the same 650x480
    await nextTick()

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(effectiveWidth.value).toBe(650)
  })

  it('follows dimension props reactively', () => {
    const props = createProps()
    const { effectiveWidth, handleResize } = useResponsiveSize(props)

    handleResize(650, 480)
    expect(effectiveWidth.value).toBe(650)

    props.width = 400
    props.height = 300
    expect(effectiveWidth.value).toBe(400)
  })
})
