"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

// Enhanced theme context with system preferences
export const useThemePreferences = () => {
  const [preferences, setPreferences] = React.useState({
    reducedMotion: false,
    highContrast: false,
    fontSize: 'default' as 'small' | 'default' | 'large',
    colorBlindness: 'none' as 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  })

  React.useEffect(() => {
    // Check for system preferences
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const highContrast = window.matchMedia('(prefers-contrast: high)').matches
    
    setPreferences(prev => ({
      ...prev,
      reducedMotion,
      highContrast
    }))

    // Listen for changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const contrastQuery = window.matchMedia('(prefers-contrast: high)')
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, reducedMotion: e.matches }))
    }
    
    const handleContrastChange = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, highContrast: e.matches }))
    }

    motionQuery.addEventListener('change', handleMotionChange)
    contrastQuery.addEventListener('change', handleContrastChange)

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange)
      contrastQuery.removeEventListener('change', handleContrastChange)
    }
  }, [])

  return { preferences, setPreferences }
}

// Theme context for accessibility
const ThemeAccessibilityContext = React.createContext<{
  preferences: ReturnType<typeof useThemePreferences>['preferences']
  setPreferences: ReturnType<typeof useThemePreferences>['setPreferences']
} | null>(null)

export const ThemeAccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences, setPreferences } = useThemePreferences()

  React.useEffect(() => {
    const root = document.documentElement
    
    // Apply accessibility preferences
    if (preferences.reducedMotion) {
      root.style.setProperty('--animation-duration', '0.01ms')
      root.style.setProperty('--transition-duration', '0.01ms')
    } else {
      root.style.removeProperty('--animation-duration')
      root.style.removeProperty('--transition-duration')
    }

    if (preferences.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Font size
    root.classList.remove('font-small', 'font-large')
    if (preferences.fontSize !== 'default') {
      root.classList.add(`font-${preferences.fontSize}`)
    }

    // Color blindness filters
    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia')
    if (preferences.colorBlindness !== 'none') {
      root.classList.add(preferences.colorBlindness)
    }
  }, [preferences])

  return (
    <ThemeAccessibilityContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </ThemeAccessibilityContext.Provider>
  )
}

export const useThemeAccessibility = () => {
  const context = React.useContext(ThemeAccessibilityContext)
  if (!context) {
    throw new Error('useThemeAccessibility must be used within ThemeAccessibilityProvider')
  }
  return context
}