import { computed, ref } from 'vue'
import type { CSSProperties } from 'vue'
import { useElementBounding } from '@vueuse/core'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { setLegendSettings, setLegendSize } from '@/state/legendSlice'
import { selectLegendPayload } from '@/state/selectors/legendSelectors'
import { selectLegendArea } from '@/state/selectors/selectLegendArea'
import { useChartHeight, useChartWidth, useMargin, useViewBox } from '@/context/chartLayoutContext'
import { useLegendPortal } from '@/chart/LegendPortalContext'
import { getUniqPayload } from '@/utils/payload/getUniqPayload'
import { sortBy } from 'es-toolkit/compat'
import type { CartesianViewBoxRequired } from '@/cartesian/type'
import type { LayoutType } from '@/types'
import { getCartesianPosition, isOutsidePosition } from '@/cartesian/getCartesianPosition'
import { cartesianPositionToCSSTranslate } from '@/cartesian/cartesianPositionToCSSTranslate'
import type { LegendPayload } from '@/components/DefaultLegendContent'
import type { LegendProps } from '../type'
import { defaultUniqBy, getDefaultPosition, getLayoutForPosition, getOutsidePositionOffset, getWidthOrHeight } from '../utils'

export function useLegend(props: LegendProps) {
  const dispatch = useAppDispatch()
  const contextPayload = useAppSelector(selectLegendPayload)
  const legendPortalFromContext = useLegendPortal()
  const margin = useMargin()
  const chartWidth = useChartWidth()
  const chartHeight = useChartHeight()
  const viewBox = useViewBox()
  const legendArea = useAppSelector(selectLegendArea)

  // Element ref for bounding box calculation
  const legendRef = ref<HTMLElement>()
  const { width: boundingWidth, height: boundingHeight } = useElementBounding(legendRef)

  // When `auto` the layout is decided based on the `position` prop:
  // left|right positions are vertical, everything else horizontal
  const resolvedLayout = computed((): LayoutType =>
    props.layout && props.layout !== 'auto' ? props.layout : getLayoutForPosition(props.position))

  // Calculate max width
  const maxWidth = computed(() =>
    chartWidth.value - (margin.value.left || 0) - (margin.value.right || 0),
  )

  // Calculate width or height based on layout
  const widthOrHeight = computed(() =>
    getWidthOrHeight(resolvedLayout.value, props.height, props.width, maxWidth.value),
  )

  // Calculate bounding box
  const boundingBox = computed(() => ({
    width: boundingWidth.value,
    height: boundingHeight.value,
  }))

  // Inside positions use the plot area; outside positions use the margin-inset chart area.
  const positionViewBox = computed((): CartesianViewBoxRequired | null => {
    if (props.position == null) {
      return null
    }
    return isOutsidePosition(props.position) ? legendArea.value : viewBox.value
  })

  // Inside/center positions are absolutely placed over the plot area
  // and must not shrink it, so their size is not reported to the store.
  const shouldReportDimensions = computed(() =>
    props.portal == null && (props.position == null || isOutsidePosition(props.position)))

  // Process payload
  const processedPayload = computed(() => {
    if (!contextPayload.value || contextPayload.value.length === 0) {
      return [] as LegendPayload[]
    }

    // Get unique payload
    let finalPayload = getUniqPayload(contextPayload.value, props.payloadUniqBy!, defaultUniqBy)

    // Sort payload
    if (props.itemSorter) {
      if (typeof props.itemSorter === 'string') {
        finalPayload = sortBy(finalPayload, props.itemSorter)
      }
      else if (typeof props.itemSorter === 'function') {
        finalPayload = sortBy(finalPayload, props.itemSorter)
      }
    }
    return Array.from(finalPayload) as LegendPayload[]
  })

  // Calculate position style from the `position` prop (overrides align/verticalAlign)
  const positionStyle = computed((): CSSProperties | undefined => {
    if (props.position == null || positionViewBox.value == null) {
      return undefined
    }

    const positionResult = getCartesianPosition({
      viewBox: positionViewBox.value,
      position: props.position,
      offset: props.offset ?? 0,
    })
    const outsidePositionOffset = getOutsidePositionOffset(props.position, props.offset ?? 0, boundingBox.value)

    const positionMaxWidth = resolvedLayout.value === 'vertical'
      ? (positionViewBox.value.width ?? 0) / 2
      : (positionViewBox.value.width ?? 0)
    const positionMaxHeight = resolvedLayout.value === 'horizontal'
      ? (positionViewBox.value.height ?? 0) / 2
      : (positionViewBox.value.height ?? 0)

    return {
      width: 'max-content',
      height: 'max-content',
      maxWidth: `${positionMaxWidth}px`,
      maxHeight: `${positionMaxHeight}px`,
      overflowY: 'auto',
      top: `${positionResult.y + (outsidePositionOffset.top ?? 0)}px`,
      left: `${positionResult.x + (outsidePositionOffset.left ?? 0)}px`,
      transform: cartesianPositionToCSSTranslate(positionResult.horizontalAnchor, positionResult.verticalAnchor),
    }
  })

  // Calculate outer style
  const outerStyle = computed((): CSSProperties => {
    const userStyle = props.wrapperStyle ? { ...props.wrapperStyle } : {}

    // If user supplies their own portal, only use their defined wrapper styles
    if (props.portal) {
      return userStyle
    }

    const baseStyle: CSSProperties = {
      position: 'absolute',
      width: widthOrHeight.value?.width ? `${widthOrHeight.value.width}px` : (props.width ? `${props.width}px` : 'auto'),
      height: widthOrHeight.value?.height ? `${widthOrHeight.value.height}px` : (props.height ? `${props.height}px` : 'auto'),
    }

    const calculatedPositionStyle = positionStyle.value ?? getDefaultPosition(
      userStyle,
      { layout: resolvedLayout.value, align: props.align, verticalAlign: props.verticalAlign },
      margin.value,
      chartWidth.value,
      chartHeight.value,
      boundingBox.value,
    )
    return { ...baseStyle, ...calculatedPositionStyle, ...userStyle }
  })

  // Determine portal target
  const legendPortal = computed(() => props.portal ?? legendPortalFromContext?.value)

  // Sync settings to store
  const syncSettings = () => {
    dispatch(setLegendSettings({
      layout: resolvedLayout.value,
      align: props.align!,
      verticalAlign: props.verticalAlign!,
      position: props.position,
      offset: props.offset,
    }))
  }

  // Sync size to store
  const syncSize = () => {
    if (!shouldReportDimensions.value) {
      return
    }
    dispatch(setLegendSize({
      width: boundingBox.value.width,
      height: boundingBox.value.height,
    }))
  }

  return {
    legendRef,
    boundingBox,
    widthOrHeight,
    processedPayload,
    outerStyle,
    legendPortal,
    resolvedLayout,
    positionViewBox,
    syncSettings,
    syncSize,
  }
}
