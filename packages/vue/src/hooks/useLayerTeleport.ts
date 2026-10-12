import type { Ref, VNode } from 'vue'
import { Teleport, h } from 'vue'
import { useMounted } from '@vueuse/core'

/** Keep the first render inline so hydration reproduces the server's SVG tree. */
export function useLayerTeleport() {
  const mounted = useMounted()
  return (content: VNode, target: Ref<string | Element | null | undefined> | null | undefined) =>
    mounted.value && target?.value ? h(Teleport, { to: target.value }, content) : content
}
