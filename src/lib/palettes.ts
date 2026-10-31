/** A gradient needs at least two colours. */
export type Gradient = readonly [string, string, ...string[]];

// SSVI brand palette, by share of the page (always light; no dark mode):
//   50% Ivory #FFFDF5 (backgrounds) · 25% Forest Green #123B27 (sidebar, headers, main buttons)
//   15% Light Green #E8EFE7 (tinted panels) · 8% Royal Gold #D4A044 (highlights)
//   2% Vermilion #A83227 (errors and warnings only) · text Charcoal #252B27

/** Royal Gold exactly as in the brand guide, for decorative use (never small text on ivory). */
export const ROYAL_GOLD = '#D4A044';

/** Every colour the screens use. */
export function resolveTheme() {
  const colors = {
    primary: '#123B27', // links, active icons, accents
    onPrimary: '#FFFFFF', // text on a solid primary fill
    primaryDark: '#123B27', // text on tinted backgrounds (secondary buttons, sidebar pill)
    primaryLight: '#E8EFE7', // tinted backgrounds (secondary buttons, segmented control, panels)
    gold: '#B8862E', // Royal Gold darkened slightly so small gold text stays readable on ivory
    bg: '#FFFDF5',
    card: '#FFFFFF',
    text: '#252B27',
    muted: '#5E665F',
    border: '#E2E8DF',
    danger: '#A83227',
    dangerLight: '#F8E9E6',
    success: '#1E6B43',
    successLight: '#E3F0E6',
    warning: '#8A5A00',
    warningLight: '#FBF1DC',
  };
  const brand: { strong: Gradient; button: Gradient; soft: Gradient } = {
    strong: ['#0C2A1B', '#123B27', '#1A4D34'], // sidebar, headers, icon tiles (white/gold on top)
    button: ['#123B27', '#1A4D34'], // primary buttons (white text on top)
    soft: ['#FFFDF5', '#F4F6EC', '#E8EFE7'], // hero cards
  };
  const shadow = `0 2px 6px ${alpha('#123B27', 0.06)}, 0 10px 28px ${alpha('#123B27', 0.07)}`;
  return { colors, brand, shadow };
}

/** Accent colour for printed bills: forest green prints well. */
export const PRINT_ACCENT = '#123B27';

function alpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
