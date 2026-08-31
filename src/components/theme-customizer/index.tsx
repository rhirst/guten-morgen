"use client"

import React from 'react'
import { Layout, Palette, RotateCcw, Settings, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useThemeManager } from '@/hooks/use-theme-manager'
import { useSidebarConfig } from '@/contexts/sidebar-context'
import { useDashboardSettings } from '@/hooks/useDashboardSettings'
import { ThemeTab } from './theme-tab'
import { LayoutTab } from './layout-tab'
import { ImportModal } from './import-modal'
import { cn } from '@/lib/utils'
import {
  CLEARED_THEME_CUSTOMIZATION,
  DEFAULT_THEME_CUSTOMIZATION,
  DEFAULT_THEME_LAYOUT,
  type ImportedTheme,
  type ThemeCustomization,
} from '@/types/theme-customizer'
import { applyThemeCustomization } from '@/utils/apply-theme-customization'

interface ThemeCustomizerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PERSIST_DEBOUNCE_MS = 400

export function ThemeCustomizer({ open, onOpenChange }: ThemeCustomizerProps) {
  const {
    applyImportedTheme,
    isDarkMode,
    resetTheme,
    applyRadius,
    setBrandColorsValues,
    applyTheme,
    applyTweakcnTheme,
    handleColorChange,
    brandColorsValues,
  } = useThemeManager()
  const { config: sidebarConfig, updateConfig: updateSidebarConfig } = useSidebarConfig()
  const { settings, update } = useDashboardSettings()

  const [activeTab, setActiveTab] = React.useState("theme")
  const [selectedTheme, setSelectedTheme] = React.useState(
    DEFAULT_THEME_CUSTOMIZATION.selectedTheme
  )
  const [selectedTweakcnTheme, setSelectedTweakcnTheme] = React.useState(
    DEFAULT_THEME_CUSTOMIZATION.selectedTweakcnTheme
  )
  const [selectedRadius, setSelectedRadius] = React.useState(
    DEFAULT_THEME_CUSTOMIZATION.selectedRadius
  )
  const [importModalOpen, setImportModalOpen] = React.useState(false)
  const [importedTheme, setImportedTheme] = React.useState<ImportedTheme | null>(null)
  const [brandColors, setBrandColors] = React.useState<Record<string, string>>({})

  const hydratedRef = React.useRef(false)
  const persistTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextPersistRef = React.useRef(false)
  const pendingPersistRef = React.useRef<ThemeCustomization | null>(null)
  const updateRef = React.useRef(update)
  updateRef.current = update

  const customizationSnapshot = React.useMemo<ThemeCustomization>(
    () => ({
      selectedTheme,
      selectedTweakcnTheme,
      selectedRadius,
      importedTheme,
      brandColors,
      layout: {
        variant: sidebarConfig.variant,
        collapsible: sidebarConfig.collapsible,
        side: sidebarConfig.side,
      },
    }),
    [
      selectedTheme,
      selectedTweakcnTheme,
      selectedRadius,
      importedTheme,
      brandColors,
      sidebarConfig.variant,
      sidebarConfig.collapsible,
      sidebarConfig.side,
    ]
  )
  const customizationRef = React.useRef<ThemeCustomization>(customizationSnapshot)
  customizationRef.current = customizationSnapshot

  const persistCustomization = React.useCallback(async (next: ThemeCustomization) => {
    try {
      await updateRef.current({ theme_customization: next })
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save theme customization"
      )
    }
  }, [])

  const schedulePersist = React.useCallback(
    (next: ThemeCustomization) => {
      pendingPersistRef.current = next
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current)
      }
      persistTimerRef.current = setTimeout(() => {
        const payload = pendingPersistRef.current
        pendingPersistRef.current = null
        persistTimerRef.current = null
        if (payload) {
          void persistCustomization(payload)
        }
      }, PERSIST_DEBOUNCE_MS)
    },
    [persistCustomization]
  )

  const flushPendingPersist = React.useCallback(() => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current)
      persistTimerRef.current = null
    }
    const payload = pendingPersistRef.current
    pendingPersistRef.current = null
    if (payload) {
      void persistCustomization(payload)
    }
  }, [persistCustomization])

  const hydrateFromCustomization = React.useCallback(
    (customization: ThemeCustomization) => {
      skipNextPersistRef.current = true
      setSelectedTheme(customization.selectedTheme)
      setSelectedTweakcnTheme(customization.selectedTweakcnTheme)
      setSelectedRadius(customization.selectedRadius)
      setImportedTheme(customization.importedTheme)
      setBrandColors(customization.brandColors)
      setBrandColorsValues(customization.brandColors)
      updateSidebarConfig(customization.layout ?? DEFAULT_THEME_LAYOUT)
      applyThemeCustomization(customization, isDarkMode, {
        resetTheme,
        applyTheme,
        applyTweakcnTheme,
        applyImportedTheme,
        applyRadius,
        handleColorChange,
        setBrandColorsValues,
      })
    },
    [
      isDarkMode,
      resetTheme,
      applyTheme,
      applyTweakcnTheme,
      applyImportedTheme,
      applyRadius,
      handleColorChange,
      setBrandColorsValues,
      updateSidebarConfig,
    ]
  )

  React.useEffect(() => {
    if (!settings) {
      hydratedRef.current = false
      return
    }

    if (hydratedRef.current) {
      return
    }

    hydratedRef.current = true
    const saved = settings.theme_customization
    if (saved) {
      hydrateFromCustomization(saved)
    } else {
      skipNextPersistRef.current = true
    }
  }, [settings, hydrateFromCustomization])

  React.useEffect(() => {
    if (!hydratedRef.current || !settings) {
      return
    }

    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false
      return
    }

    schedulePersist(customizationSnapshot)
  }, [customizationSnapshot, schedulePersist, settings])

  React.useEffect(() => {
    return () => {
      flushPendingPersist()
    }
  }, [flushPendingPersist])

  // Re-apply light/dark style maps when mode flips (after hydrate; selection handlers apply immediately)
  React.useEffect(() => {
    if (!hydratedRef.current) {
      return
    }

    applyThemeCustomization(customizationRef.current, isDarkMode, {
      resetTheme,
      applyTheme,
      applyTweakcnTheme,
      applyImportedTheme,
      applyRadius,
      handleColorChange,
      setBrandColorsValues,
    })
  }, [
    isDarkMode,
    resetTheme,
    applyTheme,
    applyTweakcnTheme,
    applyImportedTheme,
    applyRadius,
    handleColorChange,
    setBrandColorsValues,
  ])

  const handleReset = () => {
    setSelectedTheme(CLEARED_THEME_CUSTOMIZATION.selectedTheme)
    setSelectedTweakcnTheme(CLEARED_THEME_CUSTOMIZATION.selectedTweakcnTheme)
    setSelectedRadius(CLEARED_THEME_CUSTOMIZATION.selectedRadius)
    setImportedTheme(null)
    setBrandColors({})
    setBrandColorsValues({})

    resetTheme()
    applyRadius(CLEARED_THEME_CUSTOMIZATION.selectedRadius)

    updateSidebarConfig({ ...DEFAULT_THEME_LAYOUT })
  }

  const handleImport = (themeData: ImportedTheme) => {
    setImportedTheme(themeData)
    setSelectedTheme("")
    setSelectedTweakcnTheme("")
    setBrandColors({})
    applyImportedTheme(themeData, isDarkMode)
  }

  const handleImportClick = () => {
    setImportModalOpen(true)
  }

  const handleBrandColorChange = (cssVar: string, value: string) => {
    handleColorChange(cssVar, value)
    setBrandColorsValues((prev) => ({ ...prev, [cssVar]: value }))
    setBrandColors((prev) => ({ ...prev, [cssVar]: value }))
  }

  const handleClearBrandColors = () => {
    setBrandColors({})
    setBrandColorsValues({})
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
        <SheetContent
          side={sidebarConfig.side === "left" ? "right" : "left"}
          className="w-[400px] p-0 gap-0 pointer-events-auto [&>button]:hidden overflow-hidden flex flex-col"
          onInteractOutside={(e) => {
            if (importModalOpen) {
              e.preventDefault()
            }
          }}
        >
          <SheetHeader className="space-y-0 p-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="h-4 w-4" />
              </div>
              <SheetTitle className="text-lg font-semibold">Customizer</SheetTitle>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleReset} className="cursor-pointer h-8 w-8">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => onOpenChange(false)} className="cursor-pointer h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <SheetDescription className="text-sm text-muted-foreground sr-only">
              Customize the them and layout of your dashboard.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="py-2">
                <TabsList className="grid w-full grid-cols-2 rounded-none h-12 p-1.5">
                  <TabsTrigger value="theme" className="cursor-pointer data-[state=active]:bg-background"><Palette className="h-4 w-4 mr-1" /> Theme</TabsTrigger>
                  <TabsTrigger value="layout" className="cursor-pointer data-[state=active]:bg-background"><Layout className="h-4 w-4 mr-1" /> Layout</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="theme" className="flex-1 mt-0">
                <ThemeTab
                  selectedTheme={selectedTheme}
                  setSelectedTheme={setSelectedTheme}
                  selectedTweakcnTheme={selectedTweakcnTheme}
                  setSelectedTweakcnTheme={setSelectedTweakcnTheme}
                  selectedRadius={selectedRadius}
                  setSelectedRadius={setSelectedRadius}
                  setImportedTheme={setImportedTheme}
                  onImportClick={handleImportClick}
                  onBrandColorChange={handleBrandColorChange}
                  onClearBrandColors={handleClearBrandColors}
                  brandColorsValues={brandColorsValues}
                  isDarkMode={isDarkMode}
                  applyTheme={applyTheme}
                  applyTweakcnTheme={applyTweakcnTheme}
                  applyRadius={applyRadius}
                />
              </TabsContent>

              <TabsContent value="layout" className="flex-1 mt-0">
                <LayoutTab />
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImport={handleImport}
      />
    </>
  )
}

export function ThemeCustomizerTrigger({ onClick }: { onClick: () => void }) {
  const { config: sidebarConfig } = useSidebarConfig()

  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        "fixed top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer",
        sidebarConfig.side === "left" ? "right-4" : "left-4"
      )}
    >
      <Settings className="h-5 w-5" />
    </Button>
  )
}
