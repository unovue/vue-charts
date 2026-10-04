<script setup lang="ts">
import { useCanMeasureText } from '@/animation/renderPhase'
import { computed, useAttrs } from 'vue'
import { getStringSize } from '@/utils/attrs'
import { svgAttrs } from '@/utils/VueUtils'
import { reduceCSSCalc } from '@/utils/ReduceCSSCalc'

// Labels and ticks pass their whole entry along; only SVG attributes reach the element.
defineOptions({ inheritAttrs: false })

const props = defineProps({
  x: { type: [Number, String], default: 0 },
  y: { type: [Number, String], default: 0 },
  dx: { type: Number, default: undefined },
  dy: { type: Number, default: undefined },
  lineHeight: { type: [Number, String], default: '1em' },
  capHeight: { type: [Number, String], default: '0.71em' },
  scaleToFit: { type: Boolean, default: false },
  textAnchor: { type: String, default: 'start' },
  verticalAnchor: { type: String, default: 'end' },
  fill: { type: String, default: 'var(--v-charts-text, #808080)' },
  angle: { type: Number, default: 0 },
  style: { type: Object, default: () => ({}) },
  breakAll: { type: Boolean, default: false },
  maxLines: { type: Number, default: undefined },
  width: { type: [Number, String], default: undefined },
  value: { type: [String, Number], default: '' },
})

const attrs = useAttrs()
const elementAttrs = computed(() => svgAttrs(attrs))

const canMeasureText = useCanMeasureText()

const BREAKING_SPACES = /[ \f\n\r\t\v\u2028\u2029]+/

function calculateWordWidths(children: string | number, breakAll: boolean, style: any) {
  let words: string[] = []
  if (children !== undefined && children !== null) {
    words = breakAll ? children.toString().split('') : children.toString().split(BREAKING_SPACES)
  }
  const wordsWithComputedWidth = words.map(word => ({ word, width: getStringSize(word, style, canMeasureText.value).width }))
  const spaceWidth = breakAll ? 0 : getStringSize('\u00A0', style, canMeasureText.value).width
  return { wordsWithComputedWidth, spaceWidth }
}

function calculateWordsByLines(
  maxLines: number | undefined,
  value: string | number,
  style: any,
  breakAll: boolean,
  initialWordsWithComputedWidth: Array<{ word: string, width: number }>,
  spaceWidth: number,
  lineWidth: number | string | undefined,
  scaleToFit: boolean,
) {
  const shouldLimitLines = typeof maxLines === 'number'
  const text = value as string
  const calculate = (words: Array<{ word: string, width: number }> = []) => {
    return words.reduce((result: any[], { word, width }) => {
      const currentLine = result[result.length - 1]
      if (
        currentLine
        && (lineWidth == null || scaleToFit || currentLine.width + width + spaceWidth < Number(lineWidth))
      ) {
        currentLine.words.push(word)
        currentLine.width += width + spaceWidth
      }
      else {
        result.push({ words: [word], width })
      }
      return result
    }, [])
  }
  const originalResult = calculate(initialWordsWithComputedWidth)
  const findLongestLine = (words: Array<{ words: string[], width?: number }>) =>
    words.reduce((a, b) => (a.width! > b.width! ? a : b))
  if (!shouldLimitLines || scaleToFit) {
    return originalResult
  }
  const overflows = originalResult.length > maxLines! || findLongestLine(originalResult).width! > Number(lineWidth)
  if (!overflows) {
    return originalResult
  }
  const suffix = '…'
  const checkOverflow = (index: number): [boolean, any[]] => {
    const tempText = text.slice(0, index)
    const { wordsWithComputedWidth } = calculateWordWidths(tempText + suffix, breakAll, style)
    const result = calculate(wordsWithComputedWidth)
    const doesOverflow = result.length > maxLines! || findLongestLine(result).width! > Number(lineWidth)
    return [doesOverflow, result]
  }
  let start = 0
  let end = text.length - 1
  let iterations = 0
  let trimmedResult
  while (start <= end && iterations <= text.length - 1) {
    const middle = Math.floor((start + end) / 2)
    const prev = middle - 1
    const [doesPrevOverflow, result] = checkOverflow(prev)
    const [doesMiddleOverflow] = checkOverflow(middle)
    if (!doesPrevOverflow && !doesMiddleOverflow) {
      start = middle + 1
    }
    if (doesPrevOverflow && doesMiddleOverflow) {
      end = middle - 1
    }
    if (!doesPrevOverflow && doesMiddleOverflow) {
      trimmedResult = result
      break
    }
    iterations++
  }
  return trimmedResult || originalResult
}

function getWordsByLines({ width, scaleToFit, value, style, breakAll, maxLines }: any) {
  if ((width || scaleToFit)) {
    const wordWidths = calculateWordWidths(value, breakAll, style)
    const wordsWithComputedWidth = wordWidths.wordsWithComputedWidth
    const spaceWidth = wordWidths.spaceWidth
    return calculateWordsByLines(
      maxLines,
      value,
      style,
      breakAll,
      wordsWithComputedWidth,
      spaceWidth,
      width,
      scaleToFit,
    )
  }
  // fallback: no width/scaleToFit, just split
  const words = value !== undefined && value !== null ? value.toString().split(BREAKING_SPACES) : []
  return [{ words }]
}

const wordsByLines = computed(() => getWordsByLines({
  width: props.width,
  scaleToFit: props.scaleToFit,
  value: props.value,
  style: props.style,
  breakAll: props.breakAll,
  maxLines: props.maxLines,
}))

const x = computed(() => Number(props.x) + (typeof props.dx === 'number' ? props.dx : 0))
const y = computed(() => Number(props.y) + (typeof props.dy === 'number' ? props.dy : 0))
const startDy = computed(() => {
  switch (props.verticalAnchor) {
    case 'start':
      return reduceCSSCalc(`calc(${props.capHeight})`)
    case 'middle':
      return reduceCSSCalc(`calc(${(wordsByLines.value.length - 1) / 2} * -${props.lineHeight} + (${props.capHeight} / 2))`)
    default:
      return reduceCSSCalc(`calc(${wordsByLines.value.length - 1} * -${props.lineHeight})`)
  }
})

const transforms = computed(() => {
  const arr: string[] = []
  if (props.scaleToFit && wordsByLines.value[0]?.width && props.width) {
    arr.push(`scale(${Number(props.width) / wordsByLines.value[0].width})`)
  }
  if (props.angle) {
    arr.push(`rotate(${props.angle}, ${x.value}, ${y.value})`)
  }
  return arr.join(' ')
})
</script>

<template>
  <text
    v-bind="elementAttrs"
    :x="x"
    :y="y"
    :transform="transforms || undefined"
    :text-anchor="props.textAnchor"
    :fill="props.fill && props.fill.includes('url') ? 'var(--v-charts-text, #808080)' : props.fill"
    class="v-charts-text"
    :style="props.style"
  >
    <slot>
      <template
        v-for="(line, index) in wordsByLines"
        :key="index"
      >
        <tspan
          :x="x"
          :dy="index === 0 ? startDy : props.lineHeight"
        >
          {{ line.words.join(props.breakAll ? '' : ' ') }}
        </tspan>
      </template>
    </slot>
  </text>
</template>
