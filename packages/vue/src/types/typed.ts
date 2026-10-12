import type { VNode } from 'vue'

// Complete known keys near the root; deeper paths keep the supported runtime lookup syntax.
type RowPath<Row, Remaining extends readonly unknown[] = [1, 1, 1, 1]> =
  Remaining extends readonly [unknown, ...infer Rest] ? {
    [Key in Extract<keyof Row, string | number>]: Key | (
      NonNullable<Row[Key]> extends readonly (infer Entry)[]
        ? `${Key}[${number}]` | `${Key}[${number}].${RowPath<Entry, Rest> & (string | number)}`
        : NonNullable<Row[Key]> extends object
          ? `${Key}.${RowPath<NonNullable<Row[Key]>, Rest> & (string | number)}`
          : never
    )
  }[Extract<keyof Row, string | number>] : Row extends object ? string | number : never

export type RowDataKey<Row> = RowPath<Row> | ((row: Row) => unknown)

export interface ChartRenderContext<Slots> {
  slots: Slots
  attrs: Record<string, unknown>
  emit: (...args: never[]) => void
}

export type ChartVNode<Props, Slots> = VNode & {
  __ctx?: ChartRenderContext<Slots> & { props: Props }
}
