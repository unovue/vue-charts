import type { Component } from 'vue'

interface ChartConfigItem {
  label?: string
  icon?: Component
  color?: string
  theme?: Record<string, string>
}

export type ChartConfig = Record<string, ChartConfigItem>
