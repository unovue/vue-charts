import { describe, expect, it } from 'vitest'
import { effectScope, isProxy, nextTick, reactive, ref, toRaw, watch } from 'vue'
import { useTrackedData } from '../useTrackedData'

// Catch accidental proxy forwarding or two notifications for one immutable replacement.
describe('useTrackedData', () => {
  it('keeps raw row identity and emits one fresh array per update, including undefined', async () => {
    const source = ref<{ metrics: { value: number } }[] | undefined>(reactive([{ metrics: { value: 20 } }]))
    const scope = effectScope()
    const updates: unknown[] = []
    const tracked = scope.run(() => {
      const data = useTrackedData(() => source.value)
      watch(data, value => updates.push(value))
      return data
    })!
    try {
      const initial = tracked.value!
      expect(isProxy(initial)).toBe(false)
      expect(initial[0]).toBe(toRaw(source.value![0]))
      expect(isProxy(initial[0])).toBe(false)
      expect(isProxy(initial[0].metrics)).toBe(false)
      source.value![0].metrics.value = 80
      await nextTick()
      expect(updates).toHaveLength(1)
      expect(tracked.value).not.toBe(initial)
      expect(tracked.value![0].metrics.value).toBe(80)
      source.value = [{ metrics: { value: 40 } }]
      await nextTick()
      expect(updates).toHaveLength(2)
      expect(tracked.value![0].metrics.value).toBe(40)
      source.value = undefined
      await nextTick()
      expect(updates).toHaveLength(3)
      expect(tracked.value).toBeUndefined()
    }
    finally {
      scope.stop()
    }
  })
})
