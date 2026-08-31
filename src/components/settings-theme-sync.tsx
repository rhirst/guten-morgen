import { useEffect } from "react"
import { useDashboardSettings } from "@/hooks/useDashboardSettings"
import { useTheme } from "@/hooks/use-theme"
import { useThemeManager } from "@/hooks/use-theme-manager"
import { useSidebarConfig } from "@/contexts/sidebar-context"
import { applyThemeCustomization } from "@/utils/apply-theme-customization"
import { DEFAULT_THEME_LAYOUT } from "@/types/theme-customizer"

export function SettingsThemeSync() {
  const { settings } = useDashboardSettings()
  const { setTheme } = useTheme()
  const { updateConfig: updateSidebarConfig } = useSidebarConfig()
  const {
    isDarkMode,
    resetTheme,
    applyTheme,
    applyTweakcnTheme,
    applyImportedTheme,
    applyRadius,
    handleColorChange,
    setBrandColorsValues,
  } = useThemeManager()

  useEffect(() => {
    const theme = settings?.theme

    if (theme === "light" || theme === "dark" || theme === "system") {
      setTheme(theme)
    }
  }, [setTheme, settings?.theme])

  useEffect(() => {
    const customization = settings?.theme_customization
    if (!customization) {
      return
    }

    applyThemeCustomization(customization, isDarkMode, {
      resetTheme,
      applyTheme,
      applyTweakcnTheme,
      applyImportedTheme,
      applyRadius,
      handleColorChange,
      setBrandColorsValues,
    })

    updateSidebarConfig(customization.layout ?? DEFAULT_THEME_LAYOUT)
  }, [
    settings?.theme_customization,
    isDarkMode,
    resetTheme,
    applyTheme,
    applyTweakcnTheme,
    applyImportedTheme,
    applyRadius,
    handleColorChange,
    setBrandColorsValues,
    updateSidebarConfig,
  ])

  return null
}
