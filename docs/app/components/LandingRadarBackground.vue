<script setup lang="ts">
// LandingRadarBackground — WebGL radar sweep (adapted from Vue Bits' Radar,
// MIT) as the landing's ambient background, adapted to the design system:
// Vue-green sweep on the --ds-bg surface, theme-following, one static frame
// under reduced motion. Mouse interaction listens on window so the
// pointer-events-none overlay still reacts.
import { Mesh, Program, Renderer, Triangle } from 'ogl'
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'

function hexToVec3(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [Number.parseInt(h.slice(0, 2), 16) / 255, Number.parseInt(h.slice(2, 4), 16) / 255, Number.parseInt(h.slice(4, 6), 16) / 255]
}

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uRingCount;
uniform float uSpokeCount;
uniform float uRingThickness;
uniform float uSpokeThickness;
uniform float uSweepSpeed;
uniform float uSweepWidth;
uniform float uSweepLobes;
uniform vec3 uColor;
uniform vec3 uBgColor;
uniform float uFalloff;
uniform float uBrightness;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;

#define TAU 6.28318530718

void main() {
  vec2 st = gl_FragCoord.xy / uResolution.xy;
  st = st * 2.0 - 1.0;
  st.x *= uResolution.x / uResolution.y;

  if (uEnableMouse) {
    vec2 mShift = (uMouse * 2.0 - 1.0);
    mShift.x *= uResolution.x / uResolution.y;
    st -= mShift * uMouseInfluence;
  }

  st *= uScale;

  float dist = length(st);
  float theta = atan(st.y, st.x);
  float t = uTime * uSpeed;

  float ringPhase = dist * uRingCount - t;
  float ringDist = abs(fract(ringPhase) - 0.5);
  float ringGlow = 1.0 - smoothstep(0.0, uRingThickness, ringDist);

  float spokeAngle = abs(fract(theta * uSpokeCount / TAU + 0.5) - 0.5) * TAU / uSpokeCount;
  float arcDist = spokeAngle * dist;
  float spokeGlow = (1.0 - smoothstep(0.0, uSpokeThickness, arcDist)) * smoothstep(0.0, 0.1, dist);

  float sweepPhase = t * uSweepSpeed;
  float sweepBeam = pow(max(0.5 * sin(uSweepLobes * theta + sweepPhase) + 0.5, 0.0), uSweepWidth);

  float fade = smoothstep(1.05, 0.85, dist) * pow(max(1.0 - dist, 0.0), uFalloff);

  float intensity = max((ringGlow + spokeGlow + sweepBeam) * fade * uBrightness, 0.0);
  vec3 col = uColor * intensity + uBgColor;

  float alpha = clamp(length(col), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`

// Design-system parameters: quiet, slow, Vue-green
const PARAMS = {
  speed: 0.6,
  scale: 0.55,
  ringCount: 8,
  spokeCount: 8,
  ringThickness: 0.04,
  spokeThickness: 0.008,
  sweepSpeed: 0.8,
  sweepWidth: 2.2,
  sweepLobes: 1,
  falloff: 2.2,
  mouseInfluence: 0.08,
}

const colorMode = useColorMode()
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function themeColors() {
  const dark = colorMode.value === 'dark'
  return {
    color: dark ? '#42d392' : '#42b883',
    bg: dark ? '#09090b' : '#fafafa',
    brightness: dark ? 0.9 : 0.75,
  }
}

const containerRef = useTemplateRef<HTMLDivElement>('containerRef')

let cleanup: (() => void) | null = null
let program: Program | null = null

function hasWebGL() {
  const canvas = document.createElement('canvas')
  return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
}

function setup() {
  // The radar is decoration: without WebGL the page simply shows no background.
  if (!containerRef.value || !hasWebGL())
    return
  const container = containerRef.value
  const { color, bg, brightness } = themeColors()

  const renderer = new Renderer({ alpha: true, premultipliedAlpha: false })
  const gl = renderer.gl
  gl.clearColor(0, 0, 0, 0)

  const currentMouse = [0.5, 0.5]
  let targetMouse = [0.5, 0.5]

  function handleMouseMove(e: MouseEvent) {
    const rect = gl.canvas.getBoundingClientRect()
    targetMouse = [(e.clientX - rect.left) / rect.width, 1.0 - (e.clientY - rect.top) / rect.height]
  }
  function handleMouseLeave() {
    targetMouse = [0.5, 0.5]
  }

  renderer.setSize(container.offsetWidth, container.offsetHeight)

  const geometry = new Triangle(gl)
  program = new Program(gl, {
    vertex: vertexShader,
    fragment: fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height] },
      uSpeed: { value: PARAMS.speed },
      uScale: { value: PARAMS.scale },
      uRingCount: { value: PARAMS.ringCount },
      uSpokeCount: { value: PARAMS.spokeCount },
      uRingThickness: { value: PARAMS.ringThickness },
      uSpokeThickness: { value: PARAMS.spokeThickness },
      uSweepSpeed: { value: PARAMS.sweepSpeed },
      uSweepWidth: { value: PARAMS.sweepWidth },
      uSweepLobes: { value: PARAMS.sweepLobes },
      uColor: { value: hexToVec3(color) },
      uBgColor: { value: hexToVec3(bg) },
      uFalloff: { value: PARAMS.falloff },
      uBrightness: { value: brightness },
      uMouse: { value: new Float32Array([0.5, 0.5]) },
      uMouseInfluence: { value: PARAMS.mouseInfluence },
      uEnableMouse: { value: !reduced },
    },
  })

  function resize() {
    renderer.setSize(container.offsetWidth, container.offsetHeight)
    program!.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height]
  }
  window.addEventListener('resize', resize)

  const mesh = new Mesh(gl, { geometry, program })
  container.appendChild(gl.canvas)

  // window-level listeners: the overlay itself is pointer-events-none
  if (!reduced) {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
  }

  let animationFrameId: number | undefined

  function update(time: number) {
    animationFrameId = requestAnimationFrame(update)
    program!.uniforms.uTime.value = time * 0.001

    currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0])
    currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1])
    program!.uniforms.uMouse.value[0] = currentMouse[0]
    program!.uniforms.uMouse.value[1] = currentMouse[1]

    renderer.render({ scene: mesh })
  }

  if (reduced) {
    // one static frame, no loop
    program.uniforms.uTime.value = 4
    renderer.render({ scene: mesh })
  }
  else {
    animationFrameId = requestAnimationFrame(update)
  }

  cleanup = () => {
    if (animationFrameId)
      cancelAnimationFrame(animationFrameId)
    window.removeEventListener('resize', resize)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseleave', handleMouseLeave)
    if (gl.canvas.parentNode === container)
      container.removeChild(gl.canvas)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    program = null
  }
}

onMounted(setup)
onBeforeUnmount(() => cleanup?.())

// theme flip: update uniforms live, no teardown needed
watch(() => colorMode.value, () => {
  if (!program)
    return
  const { color, bg, brightness } = themeColors()
  program.uniforms.uColor.value = hexToVec3(color)
  program.uniforms.uBgColor.value = hexToVec3(bg)
  program.uniforms.uBrightness.value = brightness
})
</script>

<template>
  <div
    ref="containerRef"
    class="h-full w-full"
  />
</template>
