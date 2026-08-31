export interface ThemePreset {
  label?: string
  styles: {
    light: Record<string, string>
    dark: Record<string, string>
  }
}

export interface ColorTheme {
  name: string
  value: string
  preset: ThemePreset
}

export interface SidebarVariant {
  name: string
  value: "sidebar" | "floating" | "inset"
  description: string
}

export interface SidebarCollapsibleOption {
  name: string
  value: "offcanvas" | "icon" | "none"
  description: string
}

export interface SidebarSideOption {
  name: string
  value: "left" | "right"
}

export interface RadiusOption {
  name: string
  value: string
}

export interface BrandColor {
  name: string
  cssVar: string
}

export interface ImportedTheme {
  light: Record<string, string>
  dark: Record<string, string>
}

export interface ThemeLayoutCustomization {
  variant: "sidebar" | "floating" | "inset"
  collapsible: "offcanvas" | "icon" | "none"
  side: "left" | "right"
}

/** Persisted theme customizer selections (user-scoped via dashboard_settings). */
export interface ThemeCustomization {
  selectedTheme: string
  selectedTweakcnTheme: string
  selectedRadius: string
  importedTheme: ImportedTheme | null
  brandColors: Record<string, string>
  layout: ThemeLayoutCustomization
}

export const DEFAULT_THEME_LAYOUT: ThemeLayoutCustomization = {
  variant: "inset",
  collapsible: "offcanvas",
  side: "left",
}

export const DEFAULT_THEME_CUSTOMIZATION: ThemeCustomization = {
  selectedTheme: "default",
  selectedTweakcnTheme: "",
  selectedRadius: "0.5rem",
  importedTheme: null,
  brandColors: {},
  layout: DEFAULT_THEME_LAYOUT,
}

/** State written when the customizer is reset (CSS falls back to index.css). */
export const CLEARED_THEME_CUSTOMIZATION: ThemeCustomization = {
  selectedTheme: "",
  selectedTweakcnTheme: "",
  selectedRadius: "0.5rem",
  importedTheme: null,
  brandColors: {},
  layout: DEFAULT_THEME_LAYOUT,
}
