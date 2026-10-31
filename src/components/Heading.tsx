import { Platform, Text, type TextProps } from 'react-native';

/**
 * Text in the heading typeface (Playfair Display).
 * On the website every other text uses Manrope through a global CSS rule in +html.tsx; this marks the
 * text with data-font="heading" so a more specific rule there switches it to Playfair. On phones the
 * font is loaded in the root layout and set directly.
 */
export function H({ style, ...props }: TextProps) {
  if (Platform.OS === 'web') {
    return <Text {...props} {...({ dataSet: { font: 'heading' } } as object)} style={style} />;
  }
  return <Text {...props} style={[style, { fontFamily: 'PlayfairDisplay_700Bold', fontWeight: 'normal' }]} />;
}
