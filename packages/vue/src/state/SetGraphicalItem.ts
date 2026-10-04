import { useAppDispatch } from '@/state/hooks'
import {
  type CartesianGraphicalItemSettings,
  type PolarGraphicalItemSettings,
  addCartesianGraphicalItem,
  addPolarGraphicalItem,
  removeCartesianGraphicalItem,
  removePolarGraphicalItem,
  replaceCartesianGraphicalItem,
  replacePolarGraphicalItem,
} from './graphicalItemsSlice'

import type { StackId } from '@/types/tick'
import { onUnmounted, unref, watchEffect } from 'vue'
import { getNormalizedStackId } from '@/utils/chart'
import type { MaybeRef } from 'vue'

type SetCartesianGraphicalItemProps = Partial<Omit<CartesianGraphicalItemSettings, 'stackId'> & {
  stackId: StackId | undefined
}>

export function SetCartesianGraphicalItem(_props: MaybeRef<SetCartesianGraphicalItemProps>) {
  const dispatch = useAppDispatch()
  let preSetting: CartesianGraphicalItemSettings | null = null
  watchEffect(() => {
    const props = unref(_props)
    // Only freeze the library-owned snapshot. Immer must not recursively freeze caller-owned rows.
    if (props.data)
      Object.freeze(props.data)
    const settings: CartesianGraphicalItemSettings = {
      ...(props as CartesianGraphicalItemSettings),
      stackId: getNormalizedStackId(props.stackId),
    }
    if (preSetting === null) {
      dispatch(addCartesianGraphicalItem(settings))
    }
    else if (preSetting !== settings) {
      dispatch(replaceCartesianGraphicalItem({ prev: preSetting, next: settings }))
    }
    preSetting = settings
  })
  onUnmounted(() => {
    if (preSetting) {
      dispatch(removeCartesianGraphicalItem(preSetting))
      preSetting = null
    }
  })
}

export function SetPolarGraphicalItem(_props: MaybeRef<Partial<PolarGraphicalItemSettings>>) {
  const dispatch = useAppDispatch()
  let preSetting: PolarGraphicalItemSettings | null = null
  watchEffect(() => {
    const props = unref(_props)
    // Only freeze the library-owned snapshot. Immer must not recursively freeze caller-owned rows.
    if (props.data)
      Object.freeze(props.data)
    const settings = props as PolarGraphicalItemSettings
    if (preSetting === null) {
      dispatch(addPolarGraphicalItem(settings))
    }
    else if (preSetting !== settings) {
      dispatch(replacePolarGraphicalItem({ prev: preSetting, next: settings }))
    }
    preSetting = settings
  })
  onUnmounted(() => {
    if (preSetting) {
      dispatch(removePolarGraphicalItem(preSetting))
      preSetting = null
    }
  })
}
