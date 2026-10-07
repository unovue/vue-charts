import { seriesColor } from '@/utils/theme'
import { cellGridSharedProps } from './cellGridProps'
import type { RowDataKey } from '@/types/typed'
import type { PropType, VNode, VNodeChild } from 'vue'
import type { JourneyNode, JourneyStep } from './journeyUtils'

export const JourneySankeyVueProps = {
  isAnimationActive: cellGridSharedProps.isAnimationActive,
  transition: cellGridSharedProps.transition,
  /** One row per journey: the pages (or events) in order and how many sessions took it. */
  data: { type: Array as PropType<Record<string, unknown>[]>, required: true as const },
  pathKey: { type: [String, Number, Function] as PropType<RowDataKey<Record<string, unknown>>>, default: 'path' },
  dataKey: { type: [String, Number, Function] as PropType<RowDataKey<Record<string, unknown>>>, default: 'count' },
  /** Columns to show; longer journeys are cut. Defaults to the longest journey. */
  steps: { type: Number, default: undefined },
  /**
   * Whether a journey's end means the session ended there. Set it to `false` when journeys
   * were cut before they reached you, so no node claims an "end here" share.
   */
  exitsKnown: { type: Boolean, default: true },
  color: { type: String, default: seriesColor(0) },
  /** Fill for the part of a node whose sessions end there. */
  exitColor: { type: String, default: 'var(--v-charts-inactive, #a3a3a3)' },
  nodeWidth: { type: Number, default: 8 },
  nodePadding: { type: Number, default: 8 },
  /** The pinned journey, highlighted until cleared; bind with `v-model:pinned`. Clicking a band or node pins the largest journey through it. */
  pinned: { type: Array as PropType<string[] | null>, default: undefined },
  /** Show the step headers above the columns. */
  headers: { type: Boolean, default: true },
  /** Where a node name links to; return `undefined` for no link. */
  nodeHref: { type: Function as PropType<(name: string, node: JourneyNode) => string | undefined>, default: undefined },
  /** Second line under a node name. */
  subtitleFormatter: { type: Function as PropType<(node: JourneyNode) => string>, default: undefined },
  /** Locale for numbers. Fixed by default so server and client render the same. */
  locale: { type: String, default: 'en-US' },
  desc: String,
  title: { type: String, default: undefined },
}

export interface JourneyHeaderSlotProps extends JourneyStep {
  width: number
}

export interface JourneyLabelSlotProps<Row = unknown> {
  node: JourneyNode<Row>
  /** Default second line, e.g. "11 · 55% end here". */
  subtitle: string
}

export interface JourneySankeySlots<Row = unknown> {
  header?: (props: JourneyHeaderSlotProps) => VNodeChild
  label?: (props: JourneyLabelSlotProps<Row>) => VNodeChild
  default?: () => VNode[]
}
