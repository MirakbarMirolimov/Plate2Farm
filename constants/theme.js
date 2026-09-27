// Plate2Farm visual system — calm harvest aesthetic
export const colors = {
  bg: '#F2F5F0',
  surface: '#FFFFFF',
  surfaceSoft: '#EAF1EA',
  ink: '#12241C',
  inkSoft: '#3E5248',
  muted: '#6B7C73',
  line: '#D7E0D7',
  primary: '#1F6B4A',
  primaryDark: '#0F3D2E',
  primarySoft: '#D9EFE4',
  // Top app bars — warm cocoa (not green)
  header: '#3A2F28',
  headerMuted: '#E6D5C3',
  accent: '#C45C26',
  accentSoft: '#F8E7DC',
  warn: '#B86E14',
  warnSoft: '#F8ECD8',
  danger: '#B83A3A',
  dangerSoft: '#F8E0E0',
  success: '#1F6B4A',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(18, 36, 28, 0.45)',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#0F3D2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  soft: {
    shadowColor: '#0F3D2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  float: {
    shadowColor: '#0F3D2E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10,
  },
};

export const typography = {
  hero: { fontSize: 34, fontWeight: '800', letterSpacing: -0.4, color: colors.ink },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3, color: colors.ink },
  h2: { fontSize: 20, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, fontWeight: '500', color: colors.inkSoft, lineHeight: 24 },
  label: { fontSize: 13, fontWeight: '700', color: colors.inkSoft, letterSpacing: 0.3 },
  caption: { fontSize: 13, fontWeight: '500', color: colors.muted, lineHeight: 18 },
  button: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
};
