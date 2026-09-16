import { useAppSelector } from '@/state/hooks'
import { useChartLayoutActions } from '@/state/chartContext'
import { selectContainerScale } from '@/state/selectors/containerSelectors'
import { isWellBehavedNumber } from '@/utils'
import { ref, watch } from 'vue'

export function useReportScale() {
  const layout = useChartLayoutActions()
  const domRef = ref<HTMLElement | null>(null)
  const scale = useAppSelector(selectContainerScale)

  watch([domRef, scale], () => {
    if (domRef.value == null) {
      return
    }
    const rect = domRef.value.getBoundingClientRect()
    const newScale = rect.width / domRef.value.offsetWidth
    if (isWellBehavedNumber(newScale) && newScale !== scale.value) {
      layout.setScale(newScale)
    }
  })
  return domRef
}
