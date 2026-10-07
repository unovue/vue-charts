import { ref } from 'vue'

function isFocusVisible(element: Element) {
  try {
    return element.matches(':focus-visible')
  }
  catch {
    // Engines without :focus-visible (older test DOMs) treat every focus as keyboard focus.
    return true
  }
}

interface ItemKeyboardOptions<Item> {
  /** True while there is nothing to focus; every key is ignored then. */
  empty: () => boolean
  /** The item keyboard focus starts on, or `undefined` when one is already active. */
  start: () => Item | undefined
  /** The item a key moves to from the current one, or `undefined` when the key does nothing. */
  neighbour: (key: string) => Item | undefined
  activate: (item: Item) => void
  /** Escape. */
  clear: () => void
  /** Chart-specific keys such as Enter; returns true when it handled the event. */
  keydown?: (event: KeyboardEvent) => boolean
}

/**
 * The keyboard channel every standalone item chart shares: focus that is visible starts on an
 * item, keys move between items, Escape clears. `keyboard` tells whether the last selection
 * came from the keyboard; pointer handlers reset it.
 */
export function useItemKeyboard<Item>(options: ItemKeyboardOptions<Item>) {
  const keyboard = ref(false)

  function onFocus(event: FocusEvent) {
    if (options.empty() || !isFocusVisible(event.target as Element))
      return
    const item = options.start()
    if (item === undefined)
      return
    keyboard.value = true
    options.activate(item)
  }

  function onKeydown(event: KeyboardEvent) {
    if (options.empty())
      return
    if (event.key === 'Escape') {
      keyboard.value = true
      options.clear()
      return
    }
    if (options.keydown?.(event))
      return
    const item = options.neighbour(event.key)
    if (item === undefined)
      return
    event.preventDefault()
    keyboard.value = true
    options.activate(item)
  }

  return { keyboard, onFocus, onKeydown }
}
