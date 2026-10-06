import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { ResponsiveContainer } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { MockResizeObserver } from '@/test/MockResizeObserver'

describe('responsiveContainer', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 300 })
    MockResizeObserver.instances = []
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
  })

  describe('basic rendering', () => {
    it('renders without crash', () => {
      const { container } = render(() => (
        <ResponsiveContainer>
          <div class="child">test</div>
        </ResponsiveContainer>
      ))

      expect(container.querySelector('.v-charts-responsive-container')).toBeTruthy()
    })

    it('renders with width and height props', () => {
      const { container } = render(() => (
        <ResponsiveContainer width={400} height={300}>
          <div class="child">test</div>
        </ResponsiveContainer>
      ))

      const wrapper = container.querySelector('.v-charts-responsive-container') as HTMLElement
      expect(wrapper).toBeTruthy()
      expect(wrapper.style.width).toBe('400px')
      expect(wrapper.style.height).toBe('300px')
    })

    it('renders children correctly', async () => {
      const { container } = render(() => (
        <ResponsiveContainer width={500} height={300}>
          <div class="test-child">hello</div>
        </ResponsiveContainer>
      ))
      await nextTick()

      const wrapper = container.querySelector('.v-charts-responsive-container')
      expect(wrapper).toBeTruthy()
      // Child element should be rendered inside the container
      expect(container.querySelector('.test-child')).toBeTruthy()
      expect(container.querySelector('.test-child')?.textContent).toBe('hello')
    })
  })

  describe('dimension props', () => {
    it('applies minWidth', () => {
      const { container } = render(() => (
        <ResponsiveContainer minWidth={200}>
          <div class="child">test</div>
        </ResponsiveContainer>
      ))

      const wrapper = container.querySelector('.v-charts-responsive-container') as HTMLElement
      expect(wrapper.style.minWidth).toBe('200px')
    })

    it('applies minHeight', () => {
      const { container } = render(() => (
        <ResponsiveContainer minHeight={150}>
          <div class="child">test</div>
        </ResponsiveContainer>
      ))

      const wrapper = container.querySelector('.v-charts-responsive-container') as HTMLElement
      expect(wrapper.style.minHeight).toBe('150px')
    })

    it('renders with percentage width and height', () => {
      const { container } = render(() => (
        <ResponsiveContainer width="100%" height="50%">
          <div class="child">test</div>
        </ResponsiveContainer>
      ))

      const wrapper = container.querySelector('.v-charts-responsive-container') as HTMLElement
      expect(wrapper.style.width).toBe('100%')
      expect(wrapper.style.height).toBe('50%')
    })

    it('applies maxHeight', () => {
      const { container } = render(() => (
        <ResponsiveContainer maxHeight={600}>
          <div class="child">test</div>
        </ResponsiveContainer>
      ))

      const wrapper = container.querySelector('.v-charts-responsive-container') as HTMLElement
      expect(wrapper.style.maxHeight).toBe('600px')
    })
  })

  describe('aspect ratio', () => {
    it('renders with aspect ratio', () => {
      const { container } = render(() => (
        <ResponsiveContainer width={400} aspect={2}>
          <div class="child">test</div>
        </ResponsiveContainer>
      ))

      const wrapper = container.querySelector('.v-charts-responsive-container') as HTMLElement
      expect(wrapper).toBeTruthy()
      expect(wrapper.style.width).toBe('400px')
    })
  })

  describe('id and class props', () => {
    it.each([
      { id: 'my-chart-container', css: undefined, expectedId: 'my-chart-container', expectedClass: 'v-charts-responsive-container' },
      { id: undefined, css: 'custom-class', expectedId: null, expectedClass: 'v-charts-responsive-container custom-class' },
      { id: 'chart-1', css: 'chart-wrapper', expectedId: 'chart-1', expectedClass: 'v-charts-responsive-container chart-wrapper' },
      { id: 42, css: undefined, expectedId: '42', expectedClass: 'v-charts-responsive-container' },
    ])('preserves id $id and class $css', ({ id, css, expectedId, expectedClass }) => {
      const { container } = render(() => <ResponsiveContainer id={id} class={css}><div>test</div></ResponsiveContainer>)
      const wrapper = container.querySelector('.v-charts-responsive-container')!
      expect(wrapper.getAttribute('id')).toBe(expectedId)
      expect(wrapper.getAttribute('class')).toBe(expectedClass)
    })
  })

  describe('resize behavior', () => {
    it('emits initial and resized dimensions through resize listeners', async () => {
      const onResize = vi.fn()

      const { emitted } = render(ResponsiveContainer, {
        props: { onResize },
        slots: { default: () => <div class="child">test</div> },
      })
      expect(MockResizeObserver.instances.length).toBe(1)
      await nextTick()
      const observer = MockResizeObserver.instances.at(-1)!

      observer.trigger(600, 400)
      await nextTick()

      expect(emitted().resize).toEqual([[500, 300], [600, 400]])
      expect(onResize.mock.calls).toEqual([[500, 300], [600, 400]])
    })

    it('disconnects ResizeObserver on unmount', () => {
      const { unmount } = render(() => (
        <ResponsiveContainer>
          <div class="child">test</div>
        </ResponsiveContainer>
      ))

      expect(MockResizeObserver.instances.length).toBe(1)
      const observer = MockResizeObserver.instances[0]
      const disconnectSpy = vi.spyOn(observer, 'disconnect')

      unmount()

      expect(disconnectSpy).toHaveBeenCalled()
    })
  })

  describe('child stability', () => {
    it('keeps children mounted when the container re-renders', async () => {
      const onMountedSpy = vi.fn()
      const onUnmountedSpy = vi.fn()
      const Child = defineComponent({
        setup() {
          onMounted(onMountedSpy)
          onUnmounted(onUnmountedSpy)
          return () => <div class="stable-child">test</div>
        },
      })
      const cssClass = ref('a')

      render(() => (
        <ResponsiveContainer class={cssClass.value}>
          <Child />
        </ResponsiveContainer>
      ))
      await nextTick()
      expect(onMountedSpy).toHaveBeenCalledTimes(1)

      cssClass.value = 'b'
      await nextTick()
      cssClass.value = 'c'
      await nextTick()

      expect(onMountedSpy).toHaveBeenCalledTimes(1)
      expect(onUnmountedSpy).not.toHaveBeenCalled()
    })
  })

  describe('initial dimension', () => {
    it('renders children immediately without injecting dimensions', () => {
      mockGetBoundingClientRect({ width: 0, height: 0 })

      const { container } = render(() => (
        <ResponsiveContainer initialDimension={{ width: -1, height: -1 }}>
          <div class="child-content">test</div>
        </ResponsiveContainer>
      ))

      const wrapper = container.querySelector('.v-charts-responsive-container')
      expect(wrapper).toBeTruthy()
      expect(container.querySelector('.child-content')?.textContent).toBe('test')
      expect(container.querySelector('.child-content')?.hasAttribute('width')).toBe(false)
    })
  })
})
