import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  getOrCreateDashboardSettings,
  updateDashboardSettings,
  type DashboardSettings,
} from "@/services/settings"

export function useDashboardSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<DashboardSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setSettings(null)
      setLoading(false)
      return
    }

    let mounted = true

    setLoading(true)
    getOrCreateDashboardSettings(user.id)
      .then((data) => {
        if (mounted) {
          setSettings(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to load settings")
          )
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [user])

  const update = useCallback(
    async (patch: Partial<Omit<DashboardSettings, "user_id">>) => {
      if (!user) {
        return null
      }

      const next = await updateDashboardSettings(user.id, patch)
      setSettings(next)
      return next
    },
    [user]
  )

  return {
    settings,
    loading,
    error,
    update,
  }
}
