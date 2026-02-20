export type ThemeName = 'pop' | 'heirloom'

export interface ThemeColors {
  // Backgrounds
  pageBackground: string
  cardBackground: string

  // Buttons
  primaryButton: string
  primaryButtonHover: string
  secondaryButton: string
  secondaryButtonHover: string

  // Borders
  border: string
  borderWidth: string

  // Text (for content inside cards/white backgrounds)
  textPrimary: string
  textSecondary: string
  textMuted: string
  textOnPrimary: string // Text on primary buttons

  // Text on page background (for headers, breadcrumbs on colored backgrounds)
  textOnPagePrimary: string
  textOnPageSecondary: string
  textOnPageMuted: string

  // Navigation
  navActive: string
  navInactive: string
  navHover: string

  // Status badges
  success: { bg: string; text: string }
  warning: { bg: string; text: string }
  error: { bg: string; text: string }

  // Typography
  typeSectionHeading: string
  typeStatValue: string
  typeStatLabel: string
  typeStatSubtitle: string

  // Colour values (hex) for icons/text
  primaryColor: string
  primaryColorHover: string

  // Landing page tokens
  selectionBg: string       // hex for ::selection background
  ctaSelectionBg: string    // hex for ::selection inside CTAs
  landingPageBg: string     // hex for page background (inline style)
  brandText: string         // Tailwind class e.g. 'text-ksmt-slate'
  decorativeAccent: string  // Tailwind class for subtle decorative colour
}

export const themes: Record<ThemeName, ThemeColors> = {
  pop: {
    pageBackground: 'bg-bridezilla-blue',
    cardBackground: 'bg-white',
    primaryButton: 'bg-bridezilla-pink',
    primaryButtonHover: 'hover:bg-bridezilla-orange',
    secondaryButton: 'bg-white border border-stone-200',
    secondaryButtonHover: 'hover:bg-stone-50',
    border: 'border-stone-200',
    borderWidth: 'border',
    // Text inside cards (dark on white)
    textPrimary: 'text-stone-900',
    textSecondary: 'text-stone-600',
    textMuted: 'text-stone-400',
    textOnPrimary: 'text-white',
    // Text on blue page background (light on blue)
    textOnPagePrimary: 'text-white',
    textOnPageSecondary: 'text-white/90',
    textOnPageMuted: 'text-white/60',
    navActive: 'text-bridezilla-orange',
    navInactive: 'text-white/70',
    navHover: 'hover:text-white',
    success: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-700' },
    error: { bg: 'bg-red-50', text: 'text-red-700' },
    typeSectionHeading: 'font-display text-xl md:text-2xl',
    typeStatValue: 'text-base font-semibold',
    typeStatLabel: 'text-xs font-medium uppercase tracking-widest',
    typeStatSubtitle: 'text-xs',
    primaryColor: '#EC4899', // bridezilla-pink
    primaryColorHover: '#F97316', // bridezilla-orange
    selectionBg: '#8D99AE',
    ctaSelectionBg: '#8D99AE',
    landingPageBg: '#5B9BD5',
    brandText: 'text-white',
    decorativeAccent: 'text-white/30',
  },
  heirloom: {
    pageBackground: 'bg-ksmt-cream',
    cardBackground: 'bg-white',
    primaryButton: 'bg-ksmt-brown',
    primaryButtonHover: 'hover:bg-ksmt-brown-hover',
    secondaryButton: 'bg-white border border-stone-200',
    secondaryButtonHover: 'hover:bg-stone-50',
    border: 'border-stone-200',
    borderWidth: 'border',
    // Text inside cards (dark on white)
    textPrimary: 'text-stone-900',
    textSecondary: 'text-stone-600',
    textMuted: 'text-stone-400',
    textOnPrimary: 'text-white',
    // Text on cream page background (same as card text for Heirloom)
    textOnPagePrimary: 'text-stone-900',
    textOnPageSecondary: 'text-stone-600',
    textOnPageMuted: 'text-stone-400',
    navActive: 'text-ksmt-crimson',
    navInactive: 'text-stone-500',
    navHover: 'hover:text-stone-700',
    success: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-700' },
    error: { bg: 'bg-red-50', text: 'text-red-700' },
    typeSectionHeading: 'font-display text-xl md:text-2xl',
    typeStatValue: 'text-base font-semibold',
    typeStatLabel: 'text-xs font-medium uppercase tracking-widest',
    typeStatSubtitle: 'text-xs',
    primaryColor: '#2b2421',
    primaryColorHover: '#3d342e',
    selectionBg: '#922b24',
    ctaSelectionBg: '#8D99AE',
    landingPageBg: '#FAF9F6',
    brandText: 'text-ksmt-slate',
    decorativeAccent: 'text-ksmt-mist',
  },
}
