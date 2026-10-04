import { useChartGraphicalItems } from '@/state/chartContext'
import { watch } from 'vue'

export function ReportBar(): null {
  const { addBar, removeBar } = useChartGraphicalItems()
  watch(() => ({}), (_, __, onCleanup) => {
    addBar()
    onCleanup(() => {
      removeBar()
    })
  })
  return null
}
