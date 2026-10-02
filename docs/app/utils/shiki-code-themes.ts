import type { ThemeRegistration } from 'shiki'

// Concrete dual themes for the docs code palette (ADR-0008). Used with
// shiki's dual-theme output (themes: { light, dark }) so every token span
// carries BOTH colors as inline --shiki-light/--shiki-dark vars; the theme
// flip is then a plain CSS rule-match change on the spans themselves.
//
// Do NOT "simplify" this into one theme whose colors are var(--token-*)
// references pointing at component-defined custom properties: Chrome does
// not re-run var() substitution in injected inline styles when an ancestor
// class flip changes the custom property's value, leaving stale colors
// (verified 2026-10-02, see tasks/lessons.md).

interface CodePalette {
  foreground: string
  keyword: string
  function: string
  punctuation: string
  string: string
  constant: string
  comment: string
  parameter: string
}

function codeTheme(name: string, type: 'light' | 'dark', p: CodePalette): ThemeRegistration {
  return {
    name,
    type,
    colors: {
      'editor.foreground': p.foreground,
      'editor.background': 'transparent',
    },
    tokenColors: [
      {
        scope: ['comment', 'punctuation.definition.comment'],
        settings: { foreground: p.comment },
      },
      {
        scope: ['string', 'markup.inline.raw.string'],
        settings: { foreground: p.string },
      },
      {
        scope: ['constant.numeric', 'constant.language', 'support.constant', 'keyword.other.unit'],
        settings: { foreground: p.constant },
      },
      {
        scope: [
          'keyword',
          'storage',
          'variable.language',
          'entity.name.tag',
          'punctuation.definition.tag',
          'support.type.property-name',
        ],
        settings: { foreground: p.keyword },
      },
      {
        scope: ['entity.name.function', 'support.function'],
        settings: { foreground: p.function },
      },
      {
        scope: ['variable.parameter', 'entity.other.attribute-name'],
        settings: { foreground: p.parameter },
      },
      {
        scope: ['punctuation', 'meta.brace', 'keyword.operator'],
        settings: { foreground: p.punctuation },
      },
    ],
  }
}

export const codeLightTheme = codeTheme('vccs-code-light', 'light', {
  foreground: '#18181b',
  keyword: '#b0389c',
  function: '#2a5bd7',
  punctuation: '#b25a00',
  string: '#1a7f37',
  constant: '#0b6bcb',
  comment: '#71717a',
  parameter: '#18181b',
})

export const codeDarkTheme = codeTheme('vccs-code-dark', 'dark', {
  foreground: '#fafafa',
  keyword: '#d476c2',
  function: '#82a6f5',
  punctuation: '#dd9757',
  string: '#5fce85',
  constant: '#5aa8f5',
  comment: '#8b8b94',
  parameter: '#fafafa',
})
