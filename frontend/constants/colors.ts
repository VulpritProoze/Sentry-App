export const Colors = {
  // Primary Green Colors (Main Theme)
  green: {
    50: "#f0fdf4", // Very light green background, page backgrounds
    100: "#dcfce7", // Light green background, card backgrounds, hover states
    200: "#bbf7d0", // Card borders, dividers
    300: "#86efac", // Button borders, hover borders
    400: "#4ade80", // Header gradient start
    500: "#22c55e", // Primary brand color, icons, active navigation, badges, buttons
    600: "#16a34a", // Button hover states, emphasized text, active riding badge
    700: "#15803d", // Dark green text in light backgrounds
    800: "#14532d", // Darker text in green info cards
  },

  // Emerald Colors (Secondary Accent)
  emerald: {
    200: "#a7f3d0", // Map background gradient
    500: "#10b981", // Header gradient end
  },

  // Semantic color mappings for easy reference
  primary: "#22c55e", // green-500
  primaryHover: "#16a34a", // green-600
  background: "#f0fdf4", // green-50
  cardBackground: "#dcfce7", // green-100
  border: "#bbf7d0", // green-200
  borderHover: "#86efac", // green-300

  gray: { 100: "#6b7280", 200: "#4b5563" },
  red: "#dc2626",
} as const;

export type ColorKey = keyof typeof Colors;
