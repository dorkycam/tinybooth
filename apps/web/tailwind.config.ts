import type { Config } from 'tailwindcss';
import { LIGHT_COLORS, DARK_COLORS } from '@tinybooth/ui-tokens';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: LIGHT_COLORS.paper,
        cream: LIGHT_COLORS.cream,
        ink: LIGHT_COLORS.ink,
        graphite: LIGHT_COLORS.graphite,
        stone: LIGHT_COLORS.stone,
        coral: LIGHT_COLORS.coral,
        mint: LIGHT_COLORS.mint,
        lilac: LIGHT_COLORS.lilac,
        carbon: DARK_COLORS.carbon,
        slate1: DARK_COLORS.slate,
        slate2: DARK_COLORS.slate2,
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        handwritten: ['var(--font-caveat)', 'cursive'],
      },
    },
  },
  plugins: [],
};

export default config;
