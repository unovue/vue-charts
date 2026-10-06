declare namespace JSX {
  interface IntrinsicElements {
    [elem: string]: unknown
  }

  interface Element extends VNode {}

}
