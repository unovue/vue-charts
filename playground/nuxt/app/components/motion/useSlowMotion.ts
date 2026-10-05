// Slow motion for real library animations: the page clock (performance.now, which motion-v reads
// every frame) runs `factor` times slower while it is on. Playground only.
const realNow = performance.now.bind(performance)
let factor = 1
let baseReal = 0
let baseVirtual = 0

function virtualNow() {
  return baseVirtual + (realNow() - baseReal) / factor
}

export function setSlowMotion(next: number) {
  // Rebase so time continues from where it is, without a jump.
  baseVirtual = virtualNow()
  baseReal = realNow()
  factor = next
  performance.now = factor === 1 && baseVirtual === baseReal ? realNow : virtualNow
}

export function useSlowMotion() {
  const slow = ref(1)
  watch(slow, setSlowMotion)
  onUnmounted(() => setSlowMotion(1))
  return slow
}
