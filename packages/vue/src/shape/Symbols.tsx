import {
  symbol as shapeSymbol,
  symbolCircle,
  symbolCross,
  symbolDiamond,
  symbolSquare,
  symbolStar,
  symbolTriangle,
  symbolWye,
} from 'd3-shape'
import type { SymbolType as D3SymbolType } from 'd3-shape'
import { upperFirst } from 'es-toolkit/compat'
import { isNumber } from '@/utils/validate'
import type { VueClassValue } from '@/types/common'
import { svgAttrs } from '@/utils/VueUtils'

export type SymbolType = 'circle' | 'cross' | 'diamond' | 'square' | 'star' | 'triangle' | 'wye'

type SizeType = 'area' | 'diameter'

interface SymbolFactory {
  [type: string]: D3SymbolType
}

const symbolFactories: SymbolFactory = {
  symbolCircle,
  symbolCross,
  symbolDiamond,
  symbolSquare,
  symbolStar,
  symbolTriangle,
  symbolWye,
}

const RADIAN = Math.PI / 180

const getSymbolFactory = (type: SymbolType): D3SymbolType => {
  const name = `symbol${upperFirst(type)}`
  return symbolFactories[name] || symbolCircle
}

const calculateAreaSize = (size: number, sizeType: SizeType, type: SymbolType): number => {
  if (sizeType === 'area') {
    return size
  }

  switch (type) {
    case 'cross':
      return (5 * size * size) / 9
    case 'diamond':
      return (0.5 * size * size) / Math.sqrt(3)
    case 'square':
      return size * size
    case 'star': {
      const angle = 18 * RADIAN
      return 1.25 * size * size * (Math.tan(angle) - Math.tan(angle * 2) * Math.tan(angle) ** 2)
    }
    case 'triangle':
      return (Math.sqrt(3) * size * size) / 4
    case 'wye':
      return ((21 - 10 * Math.sqrt(3)) * size * size) / 8
    default:
      return (Math.PI * size * size) / 4
  }
}

export interface SymbolsProps {
  class?: VueClassValue
  type?: SymbolType
  cx?: number
  cy?: number
  size?: number
  sizeType?: SizeType
  fill?: string
  stroke?: string
  [key: string]: any
}

export function Symbols(props: SymbolsProps) {
  const {
    type = 'circle',
    size = 64,
    sizeType = 'area',
    cx,
    cy,
    class: className,
    ...rest
  } = props

  let realType: SymbolType = 'circle'
  if (typeof type === 'string') {
    realType = type
  }

  const getPath = (): string | undefined => {
    const symbolFactory = getSymbolFactory(realType)
    const sym = shapeSymbol()
      .type(symbolFactory)
      .size(calculateAreaSize(size, sizeType, realType))

    const s = sym()
    if (s === null) {
      return undefined
    }
    return s
  }

  if (isNumber(cx) && isNumber(cy) && isNumber(size)) {
    return (
      <path
        {...svgAttrs(rest)}
        class={['v-charts-symbols', className].filter(Boolean).join(' ')}
        transform={`translate(${cx}, ${cy})`}
        d={getPath()}
      />
    )
  }

  return null
}
