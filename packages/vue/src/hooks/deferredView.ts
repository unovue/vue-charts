import type { Component } from 'vue'
import { defineAsyncComponent } from 'vue'
import { isHydrating, isServerRender } from '@/model/runtime'

/**
 * Returns the component that renders a chart item's geometry. Call during setup.
 *
 * Chart items register themselves during setup, but Vue mounts depth-first, so an item
 * renders before later siblings (another series, an axis) have registered. A client-only
 * mount corrects this before the first paint. The server renders only once, and hydration
 * must reproduce the server HTML, so there the view is wrapped as an async component: Vue
 * renders it after every sibling has run setup. Each instance needs its own wrapper,
 * because an async component renders synchronously once it has resolved.
 */
export function useDeferredView<T extends Component>(view: T): T {
  if (!isServerRender() && !isHydrating())
    return view
  return defineAsyncComponent({ loader: () => Promise.resolve(view) }) as T
}
