import { useMemo } from "react";
import { useTheme } from "tamagui";
import { useThemeContext } from "@/context/ThemeContext";
import { Colors, DarkColors } from "@/constants/colors";

export const useThemeColors = () => {
  const theme = useTheme();
  const { activeTheme } = useThemeContext();
  const isDark = activeTheme === "dark";

  // Memoize the entire color object to prevent unnecessary re-renders
  return useMemo(() => ({
    // Green colors
    green: isDark ? DarkColors.green : Colors.green,
    
    // Emerald colors
    emerald: isDark ? DarkColors.emerald : Colors.emerald,
    
    // Semantic colors
    primary: isDark ? DarkColors.primary : Colors.primary,
    primaryHover: isDark ? DarkColors.primaryHover : Colors.primaryHover,
    background: isDark ? DarkColors.background : Colors.background,
    cardBackground: isDark ? DarkColors.cardBackground : Colors.cardBackground,
    border: isDark ? DarkColors.border : Colors.border,
    borderHover: isDark ? DarkColors.borderHover : Colors.borderHover,
    
    // Other colors
    gray: isDark ? DarkColors.gray : Colors.gray,
    red: isDark ? DarkColors.red : Colors.red,
    
    // Tamagui theme tokens for direct use
    text: theme.color?.val || (isDark ? "#ffffff" : "#000000"),
    backgroundToken: theme.background?.val || (isDark ? DarkColors.background : Colors.background),
  }), [isDark, theme.color?.val, theme.background?.val]);
};

