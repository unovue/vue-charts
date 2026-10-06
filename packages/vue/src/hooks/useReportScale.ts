import { useChart } from '@/model/chart'
import { computed, ref, watch } from 'vue'
import { isWellBehavedNumber } from '@/utils'

export function useReportScale() {
  const chart = useChart()
  const domRef = ref<HTMLElement | null>(null)
  const scale = computed(() => chart.layout.value.scale)

  watch([domRef, scale], () => {
    if (domRef.value == null) {
      return
    }
    const rect = domRef.value.getBoundingClientRect()
    const newScale = rect.width / domRef.value.offsetWidth
    if (isWellBehavedNumber(newScale) && newScale !== scale.value) {
      chart.setScale(newScale)
    }
  })
  return domRef
}
