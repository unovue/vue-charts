import { lineData, randomizeLineData } from './line/data'

type Random = () => number

const between = (random: Random, low: number, high: number) => Math.round(low + random() * (high - low))

export interface BarRow {
  segment: string
  desktop: number
  mobile: number
  tablet: number
}

export const barData: BarRow[] = [
  { segment: 'Enterprise customers', desktop: 310, mobile: 120, tablet: 64 },
  { segment: 'Small and medium businesses', desktop: 240, mobile: 210, tablet: 82 },
  { segment: 'Education and nonprofits', desktop: 150, mobile: 96, tablet: 118 },
  { segment: 'Government agencies', desktop: 188, mobile: 54, tablet: 40 },
  { segment: 'Individual subscribers', desktop: 96, mobile: 280, tablet: 130 },
]

function randomizeBarData(random: Random = Math.random): BarRow[] {
  return barData.map(({ segment }) => ({ segment, desktop: between(random, 80, 320), mobile: between(random, 50, 290), tablet: between(random, 40, 140) }))
}

export interface ScatterRow {
  group: 'Desktop' | 'Mobile'
  x: number
  y: number
}

const scatterPairs = [[12, 46], [18, 80], [24, 72], [31, 110], [37, 96], [44, 138], [52, 128], [58, 170], [66, 158], [74, 196], [81, 188], [90, 226]]

export const scatterData: ScatterRow[] = scatterPairs.flatMap(([x, y]) => [
  { group: 'Desktop' as const, x: x!, y: y! },
  { group: 'Mobile' as const, x: x! + 4, y: Math.round(y! * 0.6) + 18 },
])

function randomizeScatterData(random: Random = Math.random): ScatterRow[] {
  return scatterData.map(row => ({ ...row, y: between(random, 20, 240) }))
}

/** One value per name: the pie, radial bar and funnel charts. */
export interface ShareRow {
  name: string
  value: number
}

export const shareData: ShareRow[] = [
  { name: 'Chrome', value: 275 },
  { name: 'Safari', value: 200 },
  { name: 'Firefox', value: 142 },
  { name: 'Edge', value: 96 },
]

function randomizeShareData(random: Random = Math.random): ShareRow[] {
  return shareData.map(({ name }) => ({ name, value: between(random, 60, 300) }))
}

export const funnelData: ShareRow[] = [
  { name: 'Visit', value: 1000 },
  { name: 'Sign up', value: 680 },
  { name: 'Checkout', value: 420 },
  { name: 'Purchase', value: 260 },
]

function randomizeFunnelData(random: Random = Math.random): ShareRow[] {
  const shares = [1, between(random, 60, 85) / 100, between(random, 35, 55) / 100, between(random, 15, 30) / 100]
  return funnelData.map(({ name }, index) => ({ name, value: Math.round(1000 * shares[index]!) }))
}

export interface RadarRow {
  subject: string
  desktop: number
  mobile: number
}

export const radarData: RadarRow[] = [
  { subject: 'Speed', desktop: 120, mobile: 88 },
  { subject: 'Reliability', desktop: 98, mobile: 130 },
  { subject: 'Comfort', desktop: 86, mobile: 110 },
  { subject: 'Design', desktop: 99, mobile: 60 },
  { subject: 'Safety', desktop: 85, mobile: 92 },
  { subject: 'Price', desktop: 65, mobile: 124 },
]

function randomizeRadarData(random: Random = Math.random): RadarRow[] {
  return radarData.map(({ subject }) => ({ subject, desktop: between(random, 50, 140), mobile: between(random, 50, 140) }))
}

export interface TreemapRow {
  group: string
  name: string
  value: number
}

export const treemapData: TreemapRow[] = [
  { group: 'Charts', name: 'Line', value: 420 },
  { group: 'Charts', name: 'Bar', value: 360 },
  { group: 'Charts', name: 'Pie', value: 180 },
  { group: 'Axes', name: 'XAxis', value: 260 },
  { group: 'Axes', name: 'YAxis', value: 220 },
  { group: 'Shapes', name: 'Curve', value: 240 },
  { group: 'Shapes', name: 'Sector', value: 140 },
  { group: 'Shapes', name: 'Dot', value: 60 },
]

function randomizeTreemapData(random: Random = Math.random): TreemapRow[] {
  return treemapData.map(row => ({ ...row, value: between(random, 60, 420) }))
}

export interface SankeyLinkRow {
  source: string
  target: string
  value: number
}

export interface SankeyData {
  nodes: { id: string }[]
  links: SankeyLinkRow[]
}

export const sankeyData: SankeyData = {
  nodes: ['Visit', 'Sign up', 'Left', 'Onboarding', 'Active', 'Churned'].map(id => ({ id })),
  links: [
    { source: 'Visit', target: 'Sign up', value: 800 },
    { source: 'Visit', target: 'Left', value: 200 },
    { source: 'Sign up', target: 'Onboarding', value: 600 },
    { source: 'Sign up', target: 'Left', value: 200 },
    { source: 'Onboarding', target: 'Active', value: 450 },
    { source: 'Onboarding', target: 'Churned', value: 150 },
  ],
}

function randomizeSankeyData(random: Random = Math.random): SankeyData {
  const signUp = between(random, 500, 900)
  const onboarding = Math.round(signUp * (0.6 + random() * 0.3))
  const active = Math.round(onboarding * (0.5 + random() * 0.4))
  return {
    nodes: sankeyData.nodes,
    links: [
      { source: 'Visit', target: 'Sign up', value: signUp },
      { source: 'Visit', target: 'Left', value: 1000 - signUp },
      { source: 'Sign up', target: 'Onboarding', value: onboarding },
      { source: 'Sign up', target: 'Left', value: signUp - onboarding },
      { source: 'Onboarding', target: 'Active', value: active },
      { source: 'Onboarding', target: 'Churned', value: onboarding - active },
    ],
  }
}

const monthly = { rows: lineData, randomize: randomizeLineData }
const segments = { rows: barData, randomize: randomizeBarData }
const shares = { rows: shareData, randomize: randomizeShareData }

/** What each chart page plots, and new values for the same keys so every library animates the same update. */
export const datasets: Record<string, { rows: unknown, randomize: () => unknown }> = {
  'line': monthly,
  'area': monthly,
  'bar': segments,
  'stacked-bar': segments,
  'composed': monthly,
  'scatter': { rows: scatterData, randomize: randomizeScatterData },
  'pie': shares,
  'radar': { rows: radarData, randomize: randomizeRadarData },
  'radial-bar': shares,
  'treemap': { rows: treemapData, randomize: randomizeTreemapData },
  'sankey': { rows: sankeyData, randomize: randomizeSankeyData },
  'funnel': { rows: funnelData, randomize: randomizeFunnelData },
}
