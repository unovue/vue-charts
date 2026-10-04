import { useChartGraphicalItems } from '@/state/chartContext'
import type { CartesianGraphicalItemSettings, PolarGraphicalItemSettings } from './chartGraphicalItems'

import type { StackId } from '@/types/tick'
import { onUnmounted, unref, watch } from 'vue'
import { getNormalizedStackId } from '@/utils/chart'
import type { MaybeRef } from 'vue'

type SetCartesianGraphicalItemProps = Partial<Omit<CartesianGraphicalItemSettings, 'stackId'> & {
  stackId: StackId | undefined
}>

export function SetCartesianGraphicalItem(_props: MaybeRef<SetCartesianGraphicalItemProps>) {
  const { addCartesianGraphicalItem, removeCartesianGraphicalItem, replaceCartesianGraphicalItem } = useChartGraphicalItems()
  let preSetting: CartesianGraphicalItemSettings | null = null
  watch(() => ({ ...unref(_props) }), (props) => {
    const settings: CartesianGraphicalItemSettings = {
      ...(props as CartesianGraphicalItemSettings),
      stackId: getNormalizedStackId(props.stackId),
    }
    if (preSetting === null) {
      addCartesianGraphicalItem(settings)
      preSetting = settings
    }
    else if (preSetting !== settings) {
      preSetting = replaceCartesianGraphicalItem({ prev: preSetting, next: settings })
    }
  }, { immediate: true })
  onUnmounted(() => {
    if (preSetting) {
      removeCartesianGraphicalItem(preSetting)
      preSetting = null
    }
  })
}

export function SetPolarGraphicalItem(_props: MaybeRef<Partial<PolarGraphicalItemSettings>>) {
  const { addPolarGraphicalItem, removePolarGraphicalItem, replacePolarGraphicalItem } = useChartGraphicalItems()
  let preSetting: PolarGraphicalItemSettings | null = null
  watch(() => ({ ...unref(_props) }), (props) => {
    const settings = props as PolarGraphicalItemSettings
    if (preSetting === null) {
      addPolarGraphicalItem(settings)
      preSetting = settings
    }
    else if (preSetting !== settings) {
      preSetting = replacePolarGraphicalItem({ prev: preSetting, next: settings })
    }
  }, { immediate: true })
  onUnmounted(() => {
    if (preSetting) {
      removePolarGraphicalItem(preSetting)
      preSetting = null
    }
  })
}
