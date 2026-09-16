import { defineComponent } from 'vue'
import { createContext } from '@/utils/createContext'

const [injectPanorama, providePanoramaContext] = createContext<boolean>('PanoramaContext')

export function provideIndependentChart() {
  providePanoramaContext(false)
}

/**
 * useIsPanorama composable
 * Returns the injected isPanorama value (default: false)
 */
export function useIsPanorama() {
  return injectPanorama(false)
}

/**
 * PanoramaContextProvider for Vue
 * Provides isPanorama to descendants via provide/inject. Renders slot.
 */
export const PanoramaContextProvider = defineComponent({
  name: 'PanoramaContextProvider',
  props: {
    isPanorama: {
      type: Boolean,
      required: true,
    },
  },
  setup(props, { slots }) {
    providePanoramaContext(true)
    // Render nothing, just provide context
    return () => slots.default?.()
  },
})
