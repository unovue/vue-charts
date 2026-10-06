import type { VNode, VNodeChild } from 'vue'
import type { JourneyNode, JourneyStep } from './journeyUtils'

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
