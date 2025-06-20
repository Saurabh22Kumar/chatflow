// 🎨 ChatFlow - World-Class Dynamic Theme System
// Inspired by WhatsApp, Telegram, Discord, and Matrix

export const lightTheme = {
  name: "ChatFlow Light",
  // 🎯 Core Brand Colors
  primary: "#6366F1",           // Indigo 500
  primaryLight: "#818CF8",      // Indigo 400  
  primaryDark: "#4F46E5",       // Indigo 600
  primaryRgb: "99, 102, 241",
  
  secondary: "#06B6D4",         // Cyan 500
  secondaryLight: "#22D3EE",    // Cyan 400
  secondaryDark: "#0891B2",     // Cyan 600
  
  accent: "#F59E0B",            // Amber 500
  accentLight: "#FCD34D",       // Amber 300
  accentDark: "#D97706",        // Amber 600
  
  // 🌈 Background System
  background: "#FFFFFF",        // Pure white
  backgroundSecondary: "#F8FAFC", // Slate 50
  backgroundTertiary: "#F1F5F9", // Slate 100
  
  // 📱 Surface Colors
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceVariant: "#F1F5F9",    // Slate 100
  surfaceBorder: "#E2E8F0",     // Slate 200
  surfaceDivider: "#F1F5F9",    // Slate 100
  
  // ✍️ Text Hierarchy
  textPrimary: "#0F172A",       // Slate 900
  textSecondary: "#475569",     // Slate 600
  textTertiary: "#94A3B8",      // Slate 400
  textDisabled: "#CBD5E1",      // Slate 300
  textInverse: "#FFFFFF",
  
  // 🎨 Semantic Colors
  success: "#10B981",           // Emerald 500
  successLight: "#34D399",      // Emerald 400
  warning: "#F59E0B",           // Amber 500
  warningLight: "#FBBF24",      // Amber 400
  error: "#EF4444",             // Red 500
  errorLight: "#F87171",        // Red 400
  info: "#3B82F6",              // Blue 500
  infoLight: "#60A5FA",         // Blue 400
  
  // 🌟 Status Colors
  online: "#10B981",            // Emerald 500
  away: "#F59E0B",              // Amber 500
  busy: "#EF4444",              // Red 500
  offline: "#94A3B8",           // Slate 400
  
  // 🎪 Gradients
  gradientPrimary: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
  gradientSecondary: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)",
  gradientAccent: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
  gradientSuccess: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
  gradientWarning: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
  gradientError: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
  
  // 🏃‍♂️ Animation & Transitions
  transitionFast: "150ms cubic-bezier(0.4, 0.0, 0.2, 1)",
  transitionNormal: "250ms cubic-bezier(0.4, 0.0, 0.2, 1)",
  transitionSlow: "350ms cubic-bezier(0.4, 0.0, 0.2, 1)",
  
  // 📚 Typography
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontFamilyDisplay: "'Poppins', 'Inter', sans-serif",
  fontFamilyMono: "'Fira Code', 'Monaco', 'Consolas', monospace",
  
  // 🎭 Component Specific
  chatBubbleSent: "#6366F1",
  chatBubbleReceived: "#F1F5F9",
  chatBubbleTextSent: "#FFFFFF",
  chatBubbleTextReceived: "#0F172A",
  
  // 🌊 Glassmorphism
  glassBackground: "rgba(255, 255, 255, 0.8)",
  glassBorder: "rgba(255, 255, 255, 0.3)",
  glassBlur: "blur(20px)",
  
  // 📱 Mobile Specific
  mobileHeader: "#6366F1",
  mobileHeaderText: "#FFFFFF",
  
  type: "light"
};

export const darkTheme = {
  name: "Neo-Matrix Dark",
  // 🎯 Core Brand Colors - Enhanced for dark mode
  primary: "#00FF88",           // Matrix green
  primaryLight: "#4FFFB3",      // Lighter matrix green
  primaryDark: "#00CC6A",       // Darker matrix green
  primaryRgb: "0, 255, 136",
  
  secondary: "#00FFFF",         // Cyan - digital accent
  secondaryLight: "#66FFFF",    // Light cyan
  secondaryDark: "#00CCCC",     // Dark cyan
  
  accent: "#FF0080",            // Hot pink - digital accent
  accentLight: "#FF4DA6",       // Light pink
  accentDark: "#CC0066",        // Dark pink
  
  // 🌈 Background System - Deep space matrix
  background: "#0A0A0A",        // Near black
  backgroundSecondary: "#111111", // Slight gray
  backgroundTertiary: "#1A1A1A", // Darker gray
  
  // 📱 Surface Colors - Elevated surfaces
  surface: "#1A1A1A",
  surfaceElevated: "#222222",
  surfaceVariant: "#2A2A2A",
  surfaceBorder: "#333333",
  surfaceDivider: "#2A2A2A",
  
  // ✍️ Text Hierarchy - High contrast
  textPrimary: "#00FF88",       // Matrix green for primary text
  textSecondary: "#CCCCCC",     // Light gray
  textTertiary: "#888888",      // Medium gray
  textDisabled: "#555555",      // Dark gray
  textInverse: "#0A0A0A",       // Black for inverse
  
  // 🎨 Semantic Colors - Neon variants
  success: "#00FF88",           // Matrix green
  successLight: "#4FFFB3",      // Light matrix green
  warning: "#FFD700",           // Gold
  warningLight: "#FFE55C",      // Light gold
  error: "#FF0040",             // Neon red
  errorLight: "#FF4D79",        // Light neon red
  info: "#00FFFF",              // Cyan
  infoLight: "#66FFFF",         // Light cyan
  
  // 🌟 Status Colors - Digital status
  online: "#00FF88",            // Matrix green
  away: "#FFD700",              // Gold
  busy: "#FF0040",              // Neon red
  offline: "#666666",           // Gray
  
  // 🎪 Gradients - Cyberpunk style
  gradientPrimary: "linear-gradient(135deg, #00FF88 0%, #00FFFF 100%)",
  gradientSecondary: "linear-gradient(135deg, #00FFFF 0%, #0080FF 100%)",
  gradientAccent: "linear-gradient(135deg, #FF0080 0%, #FF4DA6 100%)",
  gradientSuccess: "linear-gradient(135deg, #00FF88 0%, #4FFFB3 100%)",
  gradientWarning: "linear-gradient(135deg, #FFD700 0%, #FFE55C 100%)",
  gradientError: "linear-gradient(135deg, #FF0040 0%, #FF4D79 100%)",
  gradientMatrix: "linear-gradient(135deg, #00FF88 0%, #00FFFF 50%, #FF0080 100%)",
  
  // 🏃‍♂️ Animation & Transitions
  transitionFast: "150ms cubic-bezier(0.4, 0.0, 0.2, 1)",
  transitionNormal: "250ms cubic-bezier(0.4, 0.0, 0.2, 1)",
  transitionSlow: "350ms cubic-bezier(0.4, 0.0, 0.2, 1)",
  
  // 📚 Typography - Futuristic fonts
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', monospace",
  fontFamilyDisplay: "'Orbitron', 'JetBrains Mono', monospace",
  fontFamilyMono: "'Fira Code', 'Monaco', 'Consolas', monospace",
  
  // 🎭 Component Specific
  chatBubbleSent: "#00FF88",
  chatBubbleReceived: "#222222",
  chatBubbleTextSent: "#0A0A0A",
  chatBubbleTextReceived: "#00FF88",
  
  // 🌊 Glassmorphism - Dark glass
  glassBackground: "rgba(26, 26, 26, 0.8)",
  glassBorder: "rgba(0, 255, 136, 0.3)",
  glassBlur: "blur(20px)",
  
  // 📱 Mobile Specific
  mobileHeader: "#1A1A1A",
  mobileHeaderText: "#00FF88",
  
  type: "dark"
};

// 🎨 Legacy themes for backward compatibility
export const themes = {
  light: lightTheme,
  dark: darkTheme,
  default: lightTheme
};

export const getTheme = (themeName = 'light') => {
  return themes[themeName] || lightTheme;
};
