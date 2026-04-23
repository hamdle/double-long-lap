// PrimeNG preset that maps Vanilla Framework's design tokens onto PrimeNG's
// semantic theme. We do NOT load Vanilla's CSS at runtime — its `p-*` class
// prefix collides with PrimeNG's own `p-*` rendered classes. Instead, every
// value in this file is sourced from Vanilla's SCSS settings:
//   node_modules/vanilla-framework/scss/_settings_colors.scss
//   node_modules/vanilla-framework/scss/_settings_font.scss
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

// Ubuntu Orange ramp built around Vanilla's $color-ubuntu (#E95420).
// Hand-tuned to give PrimeNG components a believable hover/active spread.
const ubuntuOrange = {
  50: '#fef2ed',
  100: '#fde0d2',
  200: '#fbc1a5',
  300: '#f89c72',
  400: '#f37545',
  500: '#e95420',
  600: '#d23f12',
  700: '#ae2f10',
  800: '#8a2715',
  900: '#732413',
  950: '#3e1008',
};

// Warm-grey surface ramp matching Vanilla's neutrals
// (#fff, #f7f7f7, #e5e5e5, #d9d9d9, #999, #666, #111).
const warmGrey = {
  0: '#ffffff',
  50: '#f7f7f7',
  100: '#e5e5e5',
  200: '#d9d9d9',
  300: '#b8b8b8',
  400: '#999999',
  500: '#707070',
  600: '#666666',
  700: '#4a4a4a',
  800: '#2a2a2a',
  900: '#202020',
  950: '#111111',
};

export const VanillaPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '2px',
      sm: '2px',
      md: '3px',
      lg: '4px',
      xl: '8px',
    },
  },
  semantic: {
    primary: ubuntuOrange,
    // Vanilla's gray ramp drives PrimeNG's "surface" palette
    // (backgrounds, borders, muted text).
    colorScheme: {
      light: {
        surface: warmGrey,
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        // Vanilla light theme: white background, near-black text, gray borders
        formField: {
          background: '#ffffff',
          borderColor: 'rgba(0, 0, 0, 0.2)',
          hoverBorderColor: '#707070',
          focusBorderColor: '{primary.500}',
        },
        text: {
          color: '#000000',
          mutedColor: 'rgba(0, 0, 0, 0.6)',
        },
        content: {
          background: '#ffffff',
          borderColor: 'rgba(0, 0, 0, 0.2)',
        },
      },
      dark: {
        surface: warmGrey,
        primary: {
          // Slightly lighter primary on dark backgrounds for AA contrast
          color: '{primary.400}',
          contrastColor: '#111111',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
        // Vanilla dark theme: bg #262626, text #fff, alt bg #202020
        formField: {
          background: '#2f2f2f',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          hoverBorderColor: '#939393',
          focusBorderColor: '{primary.400}',
        },
        text: {
          color: '#ffffff',
          mutedColor: 'rgba(255, 255, 255, 0.6)',
        },
        content: {
          background: '#262626',
          borderColor: 'rgba(255, 255, 255, 0.2)',
        },
      },
    },
  },
});

// Vanilla brand colors exported as raw values for the few places we need them
// outside PrimeNG (e.g. theme-color meta tag, accent backgrounds).
export const VanillaBrand = {
  ubuntuOrange: '#e95420',
  accent: '#0f95a1',
  accentDark: '#70bbc2',
  positive: '#0e8420',
  positiveDark: '#008013',
  negative: '#c7162b',
  negativeDark: '#a11223',
  caution: '#cc7900',
  information: '#24598f',
  surfaceLight: '#ffffff',
  surfaceLightAlt: '#f7f7f7',
  surfaceDark: '#262626',
  surfaceDarkAlt: '#202020',
} as const;
