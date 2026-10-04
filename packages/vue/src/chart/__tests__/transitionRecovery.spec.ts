import { render } from '@testing-library/vue'
import { expect, it } from 'vitest'
import { defineComponent, h, nextTick, shallowRef } from 'vue'
import { useKeyedTransition } from '@/animation/useKeyedTransition'

interface BarItem { name: string, height: number }

it('reports only the original getter error and recovers without swallowing user callback errors', async () => {
  const data = shallowRef<BarItem[]>([{ name: 'A', height: 10 }])
  const invalid = shallowRef(false)
  const failCallback = shallowRef(false)
  const getterError = new Error('Invalid user dataKey')
  const callbackError = new Error('Invalid user animation callback')
  const errors: unknown[] = []
  const Chart = defineComponent({
    setup() {
      const { items } = useKeyedTransition(() => {
        if (invalid.value)
          throw getterError
        return data.value
      }, {
        key: item => item.name,
        interpolate: (_from, to) => to,
        enterFrom: to => to,
        exitTo: from => from,
        isActive: () => false,
        onStart: () => {
          if (failCallback.value)
            throw callbackError
        },
      })
      return () => h('svg', items.value.map(item => h('rect', { height: item.value.height })))
    },
  })
  const { container, unmount } = render(Chart, {
    global: { config: { errorHandler: error => errors.push(error) } },
  })
  try {
    expect(container.querySelector('rect')?.getAttribute('height')).toBe('10')
    invalid.value = true
    await nextTick()
    expect(errors).toEqual([getterError])

    data.value = [{ name: 'A', height: 20 }]
    invalid.value = false
    await nextTick()
    expect(container.querySelector('rect')?.getAttribute('height')).toBe('20')

    failCallback.value = true
    data.value = [{ name: 'A', height: 30 }]
    await nextTick()
    expect(errors).toEqual([getterError, callbackError])

    failCallback.value = false
    data.value = [{ name: 'A', height: 40 }]
    await nextTick()
    expect(container.querySelector('rect')?.getAttribute('height')).toBe('40')
    expect(errors).toEqual([getterError, callbackError])
  }
  finally {
    unmount()
  }
})
