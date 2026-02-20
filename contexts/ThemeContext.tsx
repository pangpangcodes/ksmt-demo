'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type ThemeName = 'heirloom'

interface ThemeContextType {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  storageKey?: string // Defaults to 'bridezilla_theme'
}

export function ThemeProvider({ children, storageKey = 'bridezilla_theme' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeName>('heirloom')

  // Load theme from localStorage on mount (but not on shared pages)
  useEffect(() => {
    // Skip localStorage for shared pages - they use SharedThemeWrapper
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/shared/')) {
      return
    }

    const saved = localStorage.getItem(storageKey)
    if (saved === 'heirloom') {
      setThemeState(saved)
    }
  }, [storageKey])

  // Save theme to localStorage when it changes (but not on shared pages)
  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme)

    // Don't save to localStorage on shared pages
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/shared/')) {
      localStorage.setItem(storageKey, newTheme)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
