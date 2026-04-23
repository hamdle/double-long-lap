// PrimeNG preset for Double Long Lap. Maps our surface scale and brand red
// onto PrimeNG's semantic theme. Token values are kept in sync with
// src/styles.scss (see plan §5.4); if you change one side, change the other.
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

// Brand red. 500 is the chosen primary (oklch(57.7% 0.245 27.325),
// ≈ Tailwind red-600). Used as accent — active nav underline, primary
// button fill, focus rings. Not used as a container background.
const brandRed = {
  50: 'oklch(97% 0.02 27)',
  100: 'oklch(93% 0.05 27)',
  200: 'oklch(88% 0.09 27)',
  300: 'oklch(81% 0.15 27)',
  400: 'oklch(70% 0.22 27)',
  500: 'oklch(57.7% 0.245 27.325)',
  600: 'oklch(50% 0.22 27)',
  700: 'oklch(43% 0.18 27)',
  800: 'oklch(36% 0.14 27)',
  900: 'oklch(29% 0.11 27)',
  950: 'oklch(20% 0.07 27)',
};

// Surface ramp. Light stops (0–300) are near-white; dark stops (700–950) are
// near-black with slightly tinted greys. The bookend chrome (header/footer)
// uses --dll-ink (#000000) directly rather than surface.950, so dark-mode
// body content sits *lighter* than the chrome and the frame reads visibly.
const surface = {
  0: '#ffffff',
  50: '#f7f7f7',
  100: '#ededed',
  200: '#e0e0e0',
  300: '#c8c8c8',
  400: '#9b9b9e',
  500: '#6e6e72',
  600: '#2a2a30',
  700: '#1f1f24',
  800: '#17171b',
  900: '#0d0d10',
  950: '#000000',
};

export const VanillaPreset = definePreset(Aura, {
  primitive: {
    // Border-radius primitives — kept in sync with --dll-radius-* in
    // styles.scss. PrimeNG component tokens reference {border.radius.lg}, etc.
    borderRadius: {
      none: '0',
      xs: '2px',
      sm: '4px',
      md: '6px',
      lg: '10px',
      xl: '16px',
      pill: '9999px',
    },
  },
  // Component-level token overrides. Keeps visual decisions for Card, Button,
  // Chip centralized here so pages can stay template-light. Values pair with
  // the --dll-* tokens in styles.scss.
  components: {
    card: {
      root: {
        borderRadius: '{border.radius.lg}',
        shadow: 'var(--dll-shadow-1)',
      },
      body: {
        padding: 'var(--dll-sp-xl)',
        gap: 'var(--dll-sp-md)',
      },
      title: {
        fontSize: '1.125rem',
        fontWeight: '600',
      },
    },
    button: {
      root: {
        borderRadius: '{border.radius.md}',
        paddingX: 'var(--dll-sp-lg)',
        paddingY: 'var(--dll-sp-sm)',
        label: { fontWeight: '600' },
      },
    },
    chip: {
      root: {
        borderRadius: '{border.radius.pill}',
        paddingX: 'var(--dll-sp-md)',
        paddingY: '4px',
        gap: 'var(--dll-sp-xs)',
      },
    },
  },
  semantic: {
    primary: brandRed,
    // Focus ring — bump width from PrimeNG's default 1px to 2px so it clears
    // WCAG visibility at a glance against both light and dark surfaces.
    focusRing: {
      width: '2px',
      offset: '2px',
    },
    colorScheme: {
      light: {
        surface,
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        formField: {
          background: '#ffffff',
          borderColor: 'rgba(0, 0, 0, 0.18)',
          hoverBorderColor: '#6e6e72',
          focusBorderColor: '{primary.500}',
        },
        text: {
          color: '#0a0a0b',
          mutedColor: 'rgba(0, 0, 0, 0.6)',
        },
        content: {
          background: '#ffffff',
          borderColor: 'rgba(0, 0, 0, 0.12)',
        },
      },
      dark: {
        surface,
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        // Form fields sit on surface.800, one stop lighter than the page
        // background (surface.900), so inputs read as elevated.
        formField: {
          background: '{surface.800}',
          borderColor: 'rgba(255, 255, 255, 0.14)',
          hoverBorderColor: 'rgba(255, 255, 255, 0.28)',
          focusBorderColor: '{primary.400}',
        },
        text: {
          color: '#f6f6f7',
          mutedColor: 'rgba(255, 255, 255, 0.6)',
        },
        // Cards/content use surface.800 against a surface.900 page so
        // elevation reads without relying on shadows alone.
        content: {
          background: '{surface.800}',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        },
        // Overlays (Dialog, Popover, Select) default to surface.900 in Aura's
        // dark scheme — same color as our page background, so the overlay
        // would blend in. Lift them to surface.800 so they visibly float.
        overlay: {
          modal: {
            background: '{surface.800}',
            borderColor: 'rgba(255, 255, 255, 0.08)',
          },
          popover: {
            background: '{surface.800}',
            borderColor: 'rgba(255, 255, 255, 0.08)',
          },
          select: {
            background: '{surface.800}',
            borderColor: 'rgba(255, 255, 255, 0.08)',
          },
        },
      },
    },
  },
});

// Brand colors exported as raw values for the few places we need them
// outside PrimeNG (e.g. theme-color meta tag, accent backgrounds).
export const VanillaBrand = {
  primary: 'oklch(57.7% 0.245 27.325)',
  ink: '#000000',
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
  surfaceDark: '#0d0d10',
  surfaceDarkAlt: '#17171b',
} as const;
