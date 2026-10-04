import type { Ref, VNode } from 'vue'
import { Teleport, h, onMounted, ref } from 'vue'

/** Keep the first render inline so hydration reproduces the server's SVG tree. */
export function useLayerTeleport() {
  const mounted = ref(false)
  onMounted(() => {
    mounted.value = true
  })
  return (content: VNode, target: Ref<Element | null | undefined> | null | undefined) =>
    mounted.value && target?.value ? h(Teleport, { to: target.value }, content) : content
}
