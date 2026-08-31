import { BaseLayout } from "@/components/layouts/base-layout"
import { useCalendar } from "@/hooks/useCalendar"
import { useDashboardSettings } from "@/hooks/useDashboardSettings"
import { useTasks } from "@/hooks/useTasks"
import { useGoogleAuth } from "@/providers/GoogleAuthProvider"
import { LiveClock } from "@/app/dashboard/components/live-clock"
import { TasksCard } from "@/app/dashboard/components/tasks-card"
import { WeatherCard } from "@/app/dashboard/components/weather-card"
import { WeekAgenda } from "@/app/dashboard/components/week-agenda"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { DEFAULT_TASK_DAY_TIMEZONE } from "@/lib/google-dates"

export default function Page() {
  const { settings } = useDashboardSettings()
  const { isAuthorized } = useGoogleAuth()
  const calendar = useCalendar(settings?.enabled_calendar_ids)
  const taskDayTimezone =
    settings?.task_day_timezone ?? DEFAULT_TASK_DAY_TIMEZONE
  const tasks = useTasks(settings?.enabled_task_list_ids, taskDayTimezone)

  const now = new Date()

  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now)

  return (
    <BaseLayout>
      <div className="@container/main space-y-4 px-4">
        <div className="flex flex-col gap-4 lg:flex-row items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <p className="text-sm text-muted-foreground">{dateLabel}</p>
            </div>
            <LiveClock clockFormat={settings?.clock_format ?? "12h"} />
          </div>
          <div className="flex w-full flex-col gap-4 sm:max-w-sm">
            <WeatherCard temperatureUnit={settings?.temperature_unit} />
          </div>
        </div>

        <WeekAgenda
          events={calendar.events}
          loading={calendar.loading}
          error={calendar.error}
          isAuthorized={isAuthorized}
        />

        <TasksCard
          tasks={tasks.tasks}
          taskLists={tasks.visibleTaskLists}
          loading={tasks.loading}
          error={tasks.error}
          isAuthorized={isAuthorized}
          taskDayTimezone={taskDayTimezone}
          onToggleTaskCompleted={tasks.toggleTaskCompleted}
        />
      </div>
    </BaseLayout>
  )
}
