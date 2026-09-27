/**
 * Brand type system: a body face for running text/UI, and a mono face for
 * timestamps/shortcuts/data. The brand's display face (Unbounded) is used only
 * in marketing materials (see the website) - not in the app itself.
 */
export const fontFamilies = {
  body: "'IBM Plex Sans', system-ui, Roboto, Helvetica, Arial, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

/** Base font size in px that `1rem` maps to. */
export const baseFontSize = 16;

/**
 * Central font-size scale. Values are relative (`rem`) so every size scales with the base.
 * Edit these to resize the whole app.
 */
export const fontSizes = {
  caption: '0.75rem', // gutter numbers, pills
  label: '0.8125rem', // timestamps, keycaps, view toggle
  body: '1rem', // editor text, buttons
  iconSm: '1.125rem', // small icons
  subtitle: '1.25rem', // preview lines
  heading: '1.5rem', // step badges
  iconMd: '2.5rem', // action-card icons
  iconLg: '4rem', // drop overlay icon
  iconXl: '4.5rem', // dropzone icon
} as const;
