import { Image, View, type ViewStyle } from 'react-native';

const full = require('../../assets/brand/logo-full-web.png');
const mark = require('../../assets/brand/logo-mark-web.png');

/**
 * Sai Venkateshwara Industries logo. The artwork is drawn for a light background, so it always sits on a
 * white tile (also on the dark green sidebar).
 * - mark: the SV monogram (240×134), for top bars and the sidebar
 * - full: monogram plus "Sai Venkateshwara Industries (Murmura Industries)" (720×511)
 */
export function Logo({ variant = 'mark', height = 40, style }: { variant?: 'mark' | 'full'; height?: number; style?: ViewStyle }) {
  const ratio = variant === 'full' ? 720 / 511 : 240 / 134;
  const pad = Math.round(height * 0.12);
  return (
    <View style={[{ backgroundColor: '#FFFFFF', borderRadius: Math.round(height * 0.22), padding: pad, alignSelf: 'flex-start' }, style]}>
      <Image
        source={variant === 'full' ? full : mark}
        style={{ height, width: Math.round(height * ratio) }}
        resizeMode="contain"
        accessibilityLabel="Sai Venkateshwara Industries logo"
      />
    </View>
  );
}
