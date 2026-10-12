import type { AriaAttributes, SVGAttributes } from 'vue'

type CamelCase<Name extends string> = Name extends `${infer Head}-${infer Tail}`
  ? `${Head}${Capitalize<CamelCase<Tail>>}`
  : Name

type Letter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'

/**
 * `data-*` attributes, in the camelized form strict templates check on components. At least one
 * letter follows `data`: a bare `data` is no data attribute, so undeclared it stays an error.
 */
type DataAttributes = { [key: `data${Letter}${string}`]: unknown }

/**
 * SVG attributes in the form that strict Vue templates check on a component: Volar camelizes
 * attribute names except `aria-*`. `class` and `style` are allowed on every component already.
 */
export type SvgTemplateAttributes = {
  [Key in keyof SVGAttributes as Key extends `aria-${string}` | 'class' | 'style'
    ? never
    : Key extends string ? CamelCase<Key> : never]?: SVGAttributes[Key]
} & AriaAttributes & DataAttributes

/**
 * Attributes a template may pass to a component whose root is an HTML element. Only the
 * accessibility and test hooks: Vue's `HTMLAttributes` also carries augmentations from other
 * packages (motion-v adds gesture props), which must not leak into our declarations.
 */
export type HtmlTemplateAttributes = AriaAttributes & DataAttributes & { id?: string, role?: string }

type ComponentConstructor = abstract new (...args: never) => { $props: unknown }

/**
 * Adds `Attributes` to the template props of component `C`. Declared props keep their own types;
 * only names the component does not declare are added. An interface, so declarations name it
 * instead of expanding the component type.
 */
interface ForwardedAttributes<C extends ComponentConstructor, Attributes> {
  new (props?: Record<string, unknown>): InstanceType<C> & {
    $props: Omit<Attributes, keyof InstanceType<C>['$props']>
  }
  /** Type only: the declared props without the forwarded attributes (see `DeclaredProps`). */
  readonly '~declaredProps'?: InstanceType<C>['$props']
}

export type WithAttributes<C extends ComponentConstructor, Attributes> = C & ForwardedAttributes<C, Attributes>

/** The props a component declares, with its events and v-model updates, but no forwarded attributes. */
export type DeclaredProps<C extends ComponentConstructor> = C extends { readonly '~declaredProps'?: infer Props }
  ? unknown extends Props ? InstanceType<C>['$props'] : Props
  : InstanceType<C>['$props']

/**
 * Marks a component that forwards undeclared attributes (`stroke-dasharray`, `data-*`,
 * `aria-*`) to its root SVG element, so strict templates (`strictTemplates`) accept them.
 * Runtime behaviour is unchanged: Vue already forwards these attributes. `@__NO_SIDE_EFFECTS__`
 * tells bundlers that a call can be dropped, so an unused wrapped component is tree-shaken.
 */
/* @__NO_SIDE_EFFECTS__ */
export function forwardsSvgAttributes<C extends ComponentConstructor>(component: C): WithAttributes<C, SvgTemplateAttributes> {
  // Only optional template props are added, so every component satisfies the wider type.
  return component as WithAttributes<C, SvgTemplateAttributes>
}

/** Like `forwardsSvgAttributes`, for components whose root is an HTML element. */
/* @__NO_SIDE_EFFECTS__ */
export function forwardsHtmlAttributes<C extends ComponentConstructor>(component: C): WithAttributes<C, HtmlTemplateAttributes> {
  return component as WithAttributes<C, HtmlTemplateAttributes>
}
