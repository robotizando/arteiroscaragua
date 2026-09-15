// Arteiros Caraguá — tokens para tailwind.config.ts (theme.extend)
// Junte com o config atual; as cores lêem as variáveis de arteiros-tokens.css.
import type { Config } from 'tailwindcss';

const hsl = (v: string) => `hsl(var(--${v}) / <alpha-value>)`;

export const arteirosTheme: NonNullable<Config['theme']>['extend'] = {
  container: { center: true, padding: { DEFAULT: '1rem', sm: '1.5rem' }, screens: { '2xl': 'var(--container-max)' } },
  fontFamily: {
    sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  },
  colors: {
    border: hsl('border'), input: hsl('input'), ring: hsl('ring'), divider: hsl('divider'),
    background: hsl('background'), foreground: hsl('foreground'),
    header: { DEFAULT: hsl('header'), foreground: hsl('header-foreground') },
    primary: { DEFAULT: hsl('primary'), foreground: hsl('primary-foreground') },
    secondary: { DEFAULT: hsl('secondary'), foreground: hsl('secondary-foreground') },
    accent: { DEFAULT: hsl('accent'), foreground: hsl('accent-foreground') },
    muted: { DEFAULT: hsl('muted'), foreground: hsl('muted-foreground') },
    card: { DEFAULT: hsl('card'), foreground: hsl('card-foreground') },
    destructive: { DEFAULT: hsl('destructive'), foreground: hsl('destructive-foreground') },
    success: { DEFAULT: hsl('success'), foreground: hsl('success-foreground') },
    whatsapp: { DEFAULT: hsl('whatsapp'), foreground: hsl('whatsapp-foreground') },
    mata: { 100: '#EAF6EE', 200: '#CFEBD8', 300: '#B5DCA1', 400: '#6CC08A', 500: '#2AAA4C', 600: '#1E7A43', 700: '#155C33', 800: '#0F4225', 900: '#0A2C19' },
    mar: { 100: '#E8F6F8', 200: '#C6EAEE', 300: '#A6E3E9', 400: '#5FC0CC', 500: '#2E9FAF', 600: '#1F7A8C', 700: '#165A68', 800: '#0F4049', 900: '#0A2A31' },
    coral: { 100: '#FDEFEF', 200: '#FDE3E4', 300: '#FFC3C7', 400: '#FF8C94', 500: '#F0716F', 600: '#E0605F', 700: '#B8464A', 800: '#8A3236', 900: '#5A2225' },
    areia: { 100: '#FBF5EC', 200: '#F9DDBD', 300: '#EDCB9F', 400: '#DDB587', 500: '#C79A66', 600: '#A97D4C', 700: '#845F38', 800: '#5F4427', 900: '#3D2B18' },
    neutro: { 100: '#F6F3EC', 200: '#EAE5DA', 300: '#D9D3C6', 400: '#B9B3A6', 500: '#948F86', 600: '#6F6D68', 700: '#5C6B6E', 800: '#3B474B', 900: '#1B2A2F' },
  },
  borderRadius: { lg: 'var(--radius)', md: 'var(--radius)', sm: 'var(--radius)', none: '0' },
  borderWidth: { rule: 'var(--rule)', grid: 'var(--grid-line)' },
  boxShadow: { sm: 'var(--shadow-sm)', md: 'var(--shadow-md)', lg: 'var(--shadow-lg)' },
  fontSize: {
    xs: ['var(--text-xs)', { lineHeight: '1.4' }], sm: ['var(--text-sm)', { lineHeight: '1.5' }],
    base: ['var(--text-base)', { lineHeight: '1.5' }], lg: ['var(--text-lg)', { lineHeight: '1.4' }],
    xl: ['var(--text-xl)', { lineHeight: '1.25' }], '2xl': ['var(--text-2xl)', { lineHeight: '1.15' }],
    '3xl': ['var(--text-3xl)', { lineHeight: '1.08' }], '4xl': ['var(--text-4xl)', { lineHeight: '1.02' }],
  },
  letterSpacing: { tight: 'var(--tracking-tight)', caps: 'var(--tracking-caps)' },
  spacing: { header: 'var(--header-height)' },
  aspectRatio: { peca: 'var(--peca-aspect)' },
};
