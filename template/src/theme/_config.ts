import type { ThemeConfiguration } from '@/theme/types/config';

import { DarkTheme, DefaultTheme } from '@react-navigation/native';

export const enum Variant {
  DARK = 'dark',
}

// Apple System Colors - Light Mode
const colorsLight = {
  // System Backgrounds
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  tertiarySystemBackground: '#FFFFFF',
  // System Grays
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',
  // Label Colors (for text)
  label: '#000000',
  secondaryLabel: '#3C3C43', // 60% opacity equivalent
  tertiaryLabel: '#3C3C43', // 30% opacity equivalent
  quaternaryLabel: '#3C3C43', // 18% opacity equivalent
  // Separator Colors
  separator: '#C6C6C8',
  opaqueSeparator: '#38383A',
  // System Colors
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemIndigo: '#5856D6',
  systemOrange: '#FF9500',
  systemPink: '#FF2D55',
  systemPurple: '#AF52DE',
  systemRed: '#FF3B30',
  systemTeal: '#5AC8FA',
  systemYellow: '#FFCC00',
  // Legacy colors (keeping for backward compatibility)
  gray100: '#DFDFDF',
  gray200: '#A1A1A1',
  gray400: '#4D4D4D',
  gray50: '#EFEFEF',
  gray800: '#303030',
  purple100: '#E1E1EF',
  purple50: '#1B1A23',
  purple500: '#44427D',
  red500: '#C13333',
  skeleton: '#A1A1A1',
} as const;

// Apple System Colors - Dark Mode
const colorsDark = {
  // System Backgrounds
  systemBackground: '#000000',
  secondarySystemBackground: '#1C1C1E',
  tertiarySystemBackground: '#2C2C2E',
  // System Grays
  systemGray: '#8E8E93',
  systemGray2: '#636366',
  systemGray3: '#48484A',
  systemGray4: '#3A3A3C',
  systemGray5: '#2C2C2E',
  systemGray6: '#1C1C1E',
  // Label Colors (for text)
  label: '#FFFFFF',
  secondaryLabel: '#EBEBF5', // 60% opacity equivalent
  tertiaryLabel: '#EBEBF5', // 30% opacity equivalent
  quaternaryLabel: '#EBEBF5', // 18% opacity equivalent
  // Separator Colors
  separator: '#38383A',
  opaqueSeparator: '#C6C6C8',
  // System Colors (same as light mode)
  systemBlue: '#0A84FF',
  systemGreen: '#30D158',
  systemIndigo: '#5E5CE6',
  systemOrange: '#FF9F0A',
  systemPink: '#FF375F',
  systemPurple: '#BF5AF2',
  systemRed: '#FF453A',
  systemTeal: '#64D2FF',
  systemYellow: '#FFD60A',
  // Legacy colors (keeping for backward compatibility)
  gray100: '#000000',
  gray200: '#BABABA',
  gray400: '#969696',
  gray50: '#EFEFEF',
  gray800: '#E0E0E0',
  purple100: '#252732',
  purple50: '#1B1A23',
  purple500: '#A6A4F0',
  red500: '#C13333',
  skeleton: '#303030',
} as const;

// Apple 8pt Grid System
const sizes = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80] as const;

export const config = {
  backgrounds: colorsLight,
  borders: {
    colors: colorsLight,
    radius: [8, 12, 16, 20, 9999], // Apple border radius system
    widths: [1, 2],
  },
  colors: colorsLight,
  fonts: {
    colors: colorsLight,
    sizes: [11, 12, 13, 15, 16, 17, 20, 22, 28, 34], // Apple typography scale
  },
  gutters: sizes,
  navigationColors: {
    ...DefaultTheme.colors,
    background: colorsLight.gray50,
    card: colorsLight.gray50,
  },
  variants: {
    dark: {
      backgrounds: colorsDark,
      borders: {
        colors: colorsDark,
      },
      colors: colorsDark,
      fonts: {
        colors: colorsDark,
      },
      navigationColors: {
        ...DarkTheme.colors,
        background: colorsDark.purple50,
        card: colorsDark.purple50,
      },
    },
  },
} as const satisfies ThemeConfiguration;
