"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { CalendarDays, CheckSquare } from "lucide-react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { GoogleAuthorizationButton } from "@/components/google/GoogleAuthorizationButton"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useCalendar } from "@/hooks/useCalendar"
import { useDashboardSettings } from "@/hooks/useDashboardSettings"
import { useTasks } from "@/hooks/useTasks"
import { useGoogleAuth } from "@/providers/GoogleAuthProvider"
import {
  enabledIdsFromToggles,
  initialSourceToggles,
} from "@/services/settings"

export default function SourcesSettings() {
  const { isAuthorized } = useGoogleAuth()
  const { settings, loading: settingsLoading, update } = useDashboardSettings()
  const calendar = useCalendar(settings?.enabled_calendar_ids)
  const tasks = useTasks(settings?.enabled_task_list_ids)

  const [calendarToggles, setCalendarToggles] = useState<Record<string, boolean>>(
    {}
  )
  const [taskListToggles, setTaskListToggles] = useState<Record<string, boolean>>(
    {}
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settingsLoading || calendar.loading) {
      return
    }

    setCalendarToggles(
      initialSourceToggles(
        calendar.calendars.map((item) => item.id),
        settings?.enabled_calendar_ids
      )
    )
  }, [
    calendar.calendars,
    calendar.loading,
    settings?.enabled_calendar_ids,
    settingsLoading,
  ])

  useEffect(() => {
    if (settingsLoading || tasks.loading) {
      return
    }

    setTaskListToggles(
      initialSourceToggles(
        tasks.taskLists.map((item) => item.id),
        settings?.enabled_task_list_ids
      )
    )
  }, [
    settings?.enabled_task_list_ids,
    settingsLoading,
    tasks.loading,
    tasks.taskLists,
  ])

  async function handleSave() {
    setSaving(true)

    try {
      await update({
        enabled_calendar_ids: enabledIdsFromToggles(calendarToggles),
        enabled_task_list_ids: enabledIdsFromToggles(taskListToggles),
      })
      toast.success("Sources saved")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save sources"
      )
    } finally {
      setSaving(false)
    }
  }

  const googleLoading = calendar.loading || tasks.loading
  const googleError = calendar.error ?? tasks.error

  return (
    <BaseLayout>
      <div className="space-y-6 px-4 lg:px-6">
        <div>
          <h1 className="text-3xl font-bold">Sources</h1>
          <p className="text-muted-foreground">
            Choose which Google calendars and task lists appear on your morning
            dashboard.
          </p>
        </div>

        {!isAuthorized && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connect Google</CardTitle>
              <CardDescription>
                Authorize Calendar and Tasks access to manage what shows on the
                dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleAuthorizationButton />
            </CardContent>
          </Card>
        )}

        {isAuthorized && (settingsLoading || googleLoading) && (
          <LoadingSpinner />
        )}

        {isAuthorized && googleError && !googleLoading && (
          <p className="text-sm text-destructive">{googleError.message}</p>
        )}

        {isAuthorized && !settingsLoading && !googleLoading && !googleError && (
          <div className="max-w-lg space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="size-4" />
                  Calendars
                </CardTitle>
                <CardDescription>
                  Events from enabled calendars show in Today’s agenda.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {calendar.calendars.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No calendars found on this Google account.
                  </p>
                ) : (
                  calendar.calendars.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              item.backgroundColor ?? "var(--primary)",
                          }}
                        />
                        <Label
                          htmlFor={`cal-${item.id}`}
                          className="truncate font-normal cursor-pointer"
                        >
                          {item.summary}
                          {item.primary ? " (Primary)" : ""}
                        </Label>
                      </div>
                      <Switch
                        id={`cal-${item.id}`}
                        checked={calendarToggles[item.id] ?? true}
                        onCheckedChange={(checked) =>
                          setCalendarToggles((prev) => ({
                            ...prev,
                            [item.id]: checked,
                          }))
                        }
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckSquare className="size-4" />
                  Task lists
                </CardTitle>
                <CardDescription>
                  Open tasks from enabled lists show in the Tasks card.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.taskLists.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No task lists found on this Google account.
                  </p>
                ) : (
                  tasks.taskLists.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4"
                    >
                      <Label
                        htmlFor={`list-${item.id}`}
                        className="truncate font-normal cursor-pointer"
                      >
                        {item.title}
                      </Label>
                      <Switch
                        id={`list-${item.id}`}
                        checked={taskListToggles[item.id] ?? true}
                        onCheckedChange={(checked) =>
                          setTaskListToggles((prev) => ({
                            ...prev,
                            [item.id]: checked,
                          }))
                        }
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Button
              type="button"
              className="cursor-pointer"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "Saving…" : "Save sources"}
            </Button>
          </div>
        )}
      </div>
    </BaseLayout>
  )
}
