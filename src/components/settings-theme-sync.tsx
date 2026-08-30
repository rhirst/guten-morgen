import { useEffect } from "react"
import { useDashboardSettings } from "@/hooks/useDashboardSettings"
import { useTheme } from "@/hooks/use-theme"

export function SettingsThemeSync() {
  const { settings } = useDashboardSettings()
  const { setTheme } = useTheme()

  useEffect(() => {
    const theme = settings?.theme

    if (theme === "light" || theme === "dark" || theme === "system") {
      setTheme(theme)
    }
  }, [setTheme, settings?.theme])

  return null
}
