import { describe, expect, it, vi } from 'vitest'
import { nextTick, reactive, watch } from 'vue'
import { useResponsiveSize } from '@/hooks/useResponsiveSize'

function createProps(overrides: Partial<{ responsive: boolean, width: number, height: number }> = {}) {
  return reactive({ responsive: false, width: undefined, height: undefined, ...overrides }) as {
    responsive: boolean
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

  it('reports invalid size when props are missing', () => {
    const props = createProps()
    const { hasValidSize } = useResponsiveSize(props)

    expect(hasValidSize.value).toBe(false)
  })

  it('ignores handleResize when not responsive', () => {
    const props = createProps({ width: 400, height: 300 })
    const { effectiveWidth, effectiveHeight, handleResize } = useResponsiveSize(props)

    handleResize(640, 480)

    expect(effectiveWidth.value).toBe(400)
    expect(effectiveHeight.value).toBe(300)
  })

  it('starts invalid in responsive mode and takes the measured size from handleResize', () => {
    const props = createProps({ responsive: true })
    const { effectiveWidth, effectiveHeight, hasValidSize, handleResize } = useResponsiveSize(props)

    expect(hasValidSize.value).toBe(false)

    handleResize(500, 300)

    expect(effectiveWidth.value).toBe(500)
    expect(effectiveHeight.value).toBe(300)
    expect(hasValidSize.value).toBe(true)
  })

  it('rounds fractional measured sizes', () => {
    const props = createProps({ responsive: true })
    const { effectiveWidth, effectiveHeight, handleResize } = useResponsiveSize(props)

    handleResize(500.4, 299.6)

    expect(effectiveWidth.value).toBe(500)
    expect(effectiveHeight.value).toBe(300)
  })

  it('dedupes no-change resize notifications', async () => {
    const props = createProps({ responsive: true })
    const { effectiveWidth, handleResize } = useResponsiveSize(props)
    const onChange = vi.fn()
    watch(effectiveWidth, onChange)

    handleResize(640, 480)
    handleResize(640, 480)
    handleResize(640.2, 479.7) // rounds to the same 640x480
    await nextTick()

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(effectiveWidth.value).toBe(640)
  })

  it('follows the responsive flag reactively', () => {
    const props = createProps({ responsive: true, width: 400, height: 300 })
    const { effectiveWidth, handleResize } = useResponsiveSize(props)

    handleResize(640, 480)
    expect(effectiveWidth.value).toBe(640)

    props.responsive = false
    expect(effectiveWidth.value).toBe(400)
  })
})
