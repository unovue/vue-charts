// The docs' simple treemap data, so the variants compare against what visitors see there.
export const treemapData = [
  {
    name: 'axis',
    children: [
      { name: 'Axes', value: 1302 },
      { name: 'Axis', value: 24593 },
      { name: 'AxisGridLine', value: 652 },
      { name: 'AxisLabel', value: 636 },
    ],
  },
  {
    name: 'controls',
    children: [
      { name: 'AnchorControl', value: 2138 },
      { name: 'ClickControl', value: 3824 },
      { name: 'Control', value: 1353 },
      { name: 'ControlList', value: 4665 },
      { name: 'DragControl', value: 2649 },
      { name: 'ExpandControl', value: 2832 },
    ],
  },
  {
    name: 'data',
    children: [
      { name: 'Data', value: 20544 },
      { name: 'DataList', value: 19788 },
      { name: 'DataSprite', value: 10349 },
      { name: 'NodeSprite', value: 19382 },
    ],
  },
  {
    name: 'events',
    children: [
      { name: 'DataEvent', value: 7313 },
      { name: 'SelectionEvent', value: 6880 },
      { name: 'TooltipEvent', value: 3701 },
    ],
  },
]

export const treemapColors = ['#f97316', '#14b8a6', '#f59e0b', '#06b6d4']
