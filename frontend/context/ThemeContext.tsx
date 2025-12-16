import React, { createContext, useContext, useLayoutEffect, useState, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { getStoredThemePreference, storeThemePreference } from '@/lib/storage';

type ThemePreference = 'light' | 'dark' | 'system';
type ActiveTheme = 'light' | 'dark';

interface ThemeContextType {
  themePreference: ThemePreference;
  activeTheme: ActiveTheme;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [activeTheme, setActiveTheme] = useState<ActiveTheme>(systemColorScheme || 'light');
  const [mounted, setMounted] = useState(false);

  // Load theme preference from storage on mount
  useLayoutEffect(() => {
    const loadThemePreference = async () => {
      const stored = await getStoredThemePreference();
      if (stored) {
        setThemePreferenceState(stored);
        // Update activeTheme immediately based on stored preference
        if (stored === 'system') {
          setActiveTheme(systemColorScheme || 'light');
        } else {
          setActiveTheme(stored);
        }
      }
      setMounted(true);
    };
    loadThemePreference();
  }, []);

  // Update active theme based on preference and system theme
  useLayoutEffect(() => {
    if (!mounted) return;
    
    if (themePreference === 'system') {
      setActiveTheme(systemColorScheme || 'light');
    } else {
      setActiveTheme(themePreference);
    }
  }, [themePreference, systemColorScheme, mounted]);

  const setThemePreference = async (preference: ThemePreference) => {
    // Update both states immediately (synchronous)
    setThemePreferenceState(preference);
    if (preference === 'system') {
      setActiveTheme(systemColorScheme || 'light');
    } else {
      setActiveTheme(preference);
    }
    
    // Store in background without blocking
    storeThemePreference(preference).catch((error) => {
      console.error('Failed to store theme preference:', error);
    });
  };

  const toggleTheme = () => {
    // Determine new theme preference immediately
    let newPreference: ThemePreference;
    if (themePreference === 'system') {
      newPreference = systemColorScheme === 'dark' ? 'light' : 'dark';
    } else if (themePreference === 'light') {
      newPreference = 'dark';
    } else {
      newPreference = 'light';
    }
    
    // Update both states immediately (synchronous, no useEffect delay)
    setThemePreferenceState(newPreference);
    setActiveTheme(newPreference);
    
    // Store in background without blocking
    storeThemePreference(newPreference).catch((error) => {
      console.error('Failed to store theme preference:', error);
    });
  };

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      themePreference,
      activeTheme,
      setThemePreference,
      toggleTheme,
    }),
    [themePreference, activeTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

