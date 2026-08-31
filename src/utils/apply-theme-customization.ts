import { tweakcnThemes } from "@/config/theme-data"
import type {
  ImportedTheme,
  ThemeCustomization,
  ThemePreset,
} from "@/types/theme-customizer"

type ThemeApplyApi = {
  resetTheme: () => void
  applyTheme: (themeValue: string, darkMode: boolean) => void
  applyTweakcnTheme: (themePreset: ThemePreset, darkMode: boolean) => void
  applyImportedTheme: (themeData: ImportedTheme, darkMode: boolean) => void
  applyRadius: (radius: string) => void
  handleColorChange: (cssVar: string, value: string) => void
  setBrandColorsValues: (values: Record<string, string>) => void
}

/**
 * Apply persisted customizer selections to the document.
 * Priority: imported → shadcn → tweakcn → reset to CSS defaults.
 */
export function applyThemeCustomization(
  customization: ThemeCustomization,
  darkMode: boolean,
  api: ThemeApplyApi
) {
  if (customization.importedTheme) {
    api.applyImportedTheme(customization.importedTheme, darkMode)
  } else if (customization.selectedTheme) {
    api.applyTheme(customization.selectedTheme, darkMode)
  } else if (customization.selectedTweakcnTheme) {
    const selectedPreset = tweakcnThemes.find(
      (t) => t.value === customization.selectedTweakcnTheme
    )?.preset
    if (selectedPreset) {
      api.applyTweakcnTheme(selectedPreset, darkMode)
    } else {
      api.resetTheme()
    }
  } else {
    api.resetTheme()
  }

  api.applyRadius(customization.selectedRadius || "0.5rem")

  const brandColors = customization.brandColors ?? {}
  if (Object.keys(brandColors).length > 0) {
    Object.entries(brandColors).forEach(([cssVar, value]) => {
      api.handleColorChange(cssVar, value)
    })
    api.setBrandColorsValues(brandColors)
  }
}
