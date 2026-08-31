"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteFooter } from "@/components/site-footer"
import { SettingsThemeSync } from "@/components/settings-theme-sync"
import { useSidebarConfig } from "@/hooks/use-sidebar-config"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

interface BaseLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  hideFooter?: boolean
  /** Lock content area to viewport height (no page scroll) */
  fillViewport?: boolean
}

export function BaseLayout({
  children,
  title,
  description,
  hideFooter = false,
  fillViewport = false,
}: BaseLayoutProps) {
  const { config } = useSidebarConfig()

  const contentShell = (
    <div
      className={cn(
        "flex flex-1 flex-col",
        fillViewport && "min-h-0 overflow-hidden"
      )}
    >
      <div
        className={cn(
          "@container/main flex flex-1 flex-col gap-2",
          fillViewport && "min-h-0 overflow-hidden"
        )}
      >
        <div
          className={cn(
            "flex flex-col",
            fillViewport
              ? "min-h-0 flex-1 overflow-hidden"
              : config.side === "left"
                ? "gap-4 md:gap-6 md:py-2"
                : "gap-4 py-4 md:gap-6 md:py-6"
          )}
        >
          {title && (
            <div className="px-4 lg:px-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {description && (
                  <p className="text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "3rem",
          "--header-height": "calc(var(--spacing) * 14)",
        } as React.CSSProperties
      }
      className={cn(
        config.collapsible === "none" && "sidebar-none-mode",
        fillViewport && "h-dvh overflow-hidden"
      )}
    >
      {config.side === "left" ? (
        <>
          <AppSidebar
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />
          <SidebarInset className={cn(fillViewport && "min-h-0 overflow-hidden")}>
            {contentShell}
            {!hideFooter && <SiteFooter />}
          </SidebarInset>
        </>
      ) : (
        <>
          <SidebarInset className={cn(fillViewport && "min-h-0 overflow-hidden")}>
            {contentShell}
            {!hideFooter && <SiteFooter />}
          </SidebarInset>
          <AppSidebar
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />
        </>
      )}

      <SettingsThemeSync />
    </SidebarProvider>
  )
}
