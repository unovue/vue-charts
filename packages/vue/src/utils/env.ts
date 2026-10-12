/**
 * True without a DOM. Only for defaults outside a component, such as text measurement in
 * plain functions; inside setup use `isServerRender()` from model/runtime.
 */
export function isServer(): boolean {
  return typeof document === 'undefined'
}
