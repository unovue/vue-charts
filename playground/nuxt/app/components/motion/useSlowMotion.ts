// Slow motion for real library animations: while on, the page clock runs `factor` times slower.
// motion-v times frames from requestAnimationFrame timestamps and performance.now, so both are
// stretched. Playground only.
let factor = 1
let baseReal = 0
let baseVirtual = 0
let installed = false
let setFactor = (_next: number) => {}

function install() {
  if (installed || typeof window === 'undefined')
    return
  installed = true
  const realNow = performance.now.bind(performance)
  const realFrame = window.requestAnimationFrame.bind(window)
  const virtualNow = () => baseVirtual + (realNow() - baseReal) / factor
  performance.now = virtualNow
  window.requestAnimationFrame = callback => realFrame(() => callback(virtualNow()))
  setFactor = (next) => {
    // Rebase so time carries on from where it is, without a jump.
    baseVirtual = virtualNow()
    baseReal = realNow()
    factor = next
  }
}

export function useSlowMotion() {
  const slow = ref(1)
  onMounted(install)
  watch(slow, next => setFactor(next))
  onUnmounted(() => setFactor(1))
  return slow
}
