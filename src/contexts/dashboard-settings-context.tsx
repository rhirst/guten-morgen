import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  getOrCreateDashboardSettings,
  updateDashboardSettings,
  type DashboardSettings,
} from "@/services/settings"

type DashboardSettingsContextValue = {
  settings: DashboardSettings | null
  loading: boolean
  error: Error | null
  update: (
    patch: Partial<Omit<DashboardSettings, "user_id">>
  ) => Promise<DashboardSettings | null>
}

const DashboardSettingsContext =
  createContext<DashboardSettingsContextValue | null>(null)

export function DashboardSettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState<DashboardSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setSettings(null)
      setLoading(false)
      setError(null)
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

  const value = useMemo(
    () => ({
      settings,
      loading,
      error,
      update,
    }),
    [settings, loading, error, update]
  )

  return (
    <DashboardSettingsContext.Provider value={value}>
      {children}
    </DashboardSettingsContext.Provider>
  )
}

export function useDashboardSettings() {
  const context = useContext(DashboardSettingsContext)
  if (!context) {
    throw new Error(
      "useDashboardSettings must be used within a DashboardSettingsProvider"
    )
  }
  return context
}
