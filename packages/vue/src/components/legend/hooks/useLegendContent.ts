import type { CSSProperties, Component, VNodeChild } from 'vue'
import type { LayoutType } from '@/types'
import type { LegendType } from '@/types/legend'
import type { HorizontalAlignmentType, LegendPayload, VerticalAlignmentType } from '@/components/DefaultLegendContent'

interface LegendContentProps {
  layout?: LayoutType | 'auto'
  align?: HorizontalAlignmentType
  verticalAlign?: VerticalAlignmentType
  iconSize?: number
  iconType?: LegendType
  wrapperStyle?: CSSProperties
  contentStyle?: CSSProperties
  formatter?: (value: string | undefined, entry: LegendPayload) => string
  payload?: LegendPayload[]
  content?: Component | ((props: LegendContentProps) => VNodeChild)
}

export function useLegendContent(props: LegendContentProps) {
  const getWrapperStyle = (layout: LayoutType = 'horizontal', align: HorizontalAlignmentType = 'center', verticalAlign: VerticalAlignmentType = 'bottom'): CSSProperties => {
    return {
      display: 'flex',
      flexDirection: layout === 'horizontal' ? 'row' : 'column',
      justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
      alignItems: verticalAlign === 'top' ? 'flex-start' : verticalAlign === 'bottom' ? 'flex-end' : 'center',
      flexWrap: 'wrap',
      gap: '8px',
      ...(props.wrapperStyle || {}),
    }
  }

  const getContentStyle = (layout: LayoutType = 'horizontal'): CSSProperties => {
    return {
      display: 'flex',
      flexDirection: layout === 'horizontal' ? 'row' : 'column',
      gap: layout === 'horizontal' ? '16px' : '8px',
      ...(props.contentStyle || {}),
    }
  }

  const getItemStyle = (layout: LayoutType = 'horizontal'): CSSProperties => {
    return {
      display: layout === 'horizontal' ? 'inline-block' : 'block',
      marginRight: '10px',
    }
  }

  const getViewBox = () => {
    return { x: 0, y: 0, width: 32, height: 32 }
  }

  const getSvgStyle = (): CSSProperties => {
    return {
      display: 'inline-block',
      verticalAlign: 'middle',
      marginRight: '4px',
    }
  }

  const formatValue = (entry: LegendPayload) => {
    return props.formatter ? props.formatter(entry.value, entry) : entry.value
  }

  return {
    getWrapperStyle,
    getContentStyle,
    getItemStyle,
    getViewBox,
    getSvgStyle,
    formatValue,
  }
}
