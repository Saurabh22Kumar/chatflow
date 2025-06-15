export const themes = {
  default: {
    name: "ChatFlow Default",
    primary: "#7C3AED",
    secondary: "#A855F7", 
    accent: "#EC4899",
    background: "#F8FAFC",
    surface: "#FFFFFF",
    text: "#1E293B",
    textSecondary: "#64748B",
    border: "#E2E8F0",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    gradient: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)"
  },
  dark: {
    name: "Dark Mode",
    primary: "#8B5CF6",
    secondary: "#A78BFA",
    accent: "#F472B6",
    background: "#0F172A",
    surface: "#1E293B",
    text: "#F8FAFC",
    textSecondary: "#94A3B8",
    border: "#334155",
    success: "#34D399",
    warning: "#FBBF24",
    error: "#F87171",
    gradient: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)"
  },
  ocean: {
    name: "Ocean Breeze",
    primary: "#0EA5E9",
    secondary: "#0284C7",
    accent: "#06B6D4",
    background: "#F0F9FF",
    surface: "#FFFFFF",
    text: "#0C4A6E",
    textSecondary: "#0369A1",
    border: "#BAE6FD",
    success: "#059669",
    warning: "#D97706",
    error: "#DC2626",
    gradient: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)"
  },
  sunset: {
    name: "Sunset Glow",
    primary: "#F59E0B",
    secondary: "#F97316",
    accent: "#EF4444",
    background: "#FFFBEB",
    surface: "#FFFFFF",
    text: "#92400E",
    textSecondary: "#D97706",
    border: "#FED7AA",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    gradient: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)"
  }
};

export const getTheme = (themeName = 'default') => {
  return themes[themeName] || themes.default;
};
