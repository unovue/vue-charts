import { Line, LineChart, defineChartComponents } from 'vccs'

interface Row { name: string, value: number }
export const Chart = defineChartComponents<Row>()({ LineChart, Line })
