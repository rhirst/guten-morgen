import { BaseLayout } from "@/components/layouts/base-layout"
import { GoogleAuthorizationButton } from "@/components/google/GoogleAuthorizationButton"
import { useAuth } from "@/hooks/use-auth"
import { useCalendar } from "@/hooks/useCalendar"
import { useDashboardSettings } from "@/hooks/useDashboardSettings"
import { useTasks } from "@/hooks/useTasks"
import { useGoogleAuth } from "@/providers/GoogleAuthProvider"
import { AgendaCard } from "@/app/dashboard/components/agenda-card"
import { greetingForHour, LiveClock } from "@/app/dashboard/components/live-clock"
import { TasksCard } from "@/app/dashboard/components/tasks-card"
import { WeatherCard } from "@/app/dashboard/components/weather-card"

export default function Page() {
  const { user } = useAuth()
  const { settings } = useDashboardSettings()
  const { isAuthorized } = useGoogleAuth()
  const calendar = useCalendar(settings?.enabled_calendar_ids)
  const tasks = useTasks(settings?.enabled_task_list_ids)

  const now = new Date()
  const name =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    ""

  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now)

  return (
    <BaseLayout>
      <div className="@container/main px-4 lg:px-6 space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{dateLabel}</p>
            <h1 className="text-3xl font-bold tracking-tight">
              {greetingForHour(now.getHours())}
              {name ? `, ${name}` : ""}
            </h1>
            <LiveClock clockFormat={settings?.clock_format ?? "12h"} />
          </div>
          <div className="flex w-full flex-col gap-4 sm:max-w-sm">
            <WeatherCard temperatureUnit={settings?.temperature_unit} />
            <GoogleAuthorizationButton />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <AgendaCard
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
          />
        </div>
      </div>
    </BaseLayout>
  )
}
