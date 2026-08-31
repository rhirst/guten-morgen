import { useMemo, useState } from "react";
import { CheckSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DEFAULT_TASK_DAY_TIMEZONE,
  formatDateOnlyLabel,
  getTaskCalendarDate,
  getTaskDayBoundary,
} from "@/lib/google-dates";
import type { GoogleTaskList, Task } from "@/services/google/tasks.types";

/**
 * Incomplete: undated, due today, or overdue (by task calendar date).
 * Completed: finished at/after the 4am day boundary.
 */
export function isDashboardTaskVisible(
  task: Task,
  {
    taskCalendarDate,
    dayBoundary,
  }: {
    taskCalendarDate: string;
    dayBoundary: Date;
  }
): boolean {
  if (task.completed) {
    if (!task.completedAt) {
      return false;
    }

    return new Date(task.completedAt).getTime() >= dayBoundary.getTime();
  }

  if (!task.due) {
    return true;
  }

  return task.due.slice(0, 10) <= taskCalendarDate;
}

function formatDue(task: Task) {
  if (!task.due) {
    return "No due date";
  }

  return formatDateOnlyLabel(task.due);
}

function sortTasks(a: Task, b: Task) {
  if (a.completed !== b.completed) {
    return a.completed ? 1 : -1;
  }

  if (a.due && b.due) {
    const dueCompare = a.due.localeCompare(b.due);
    if (dueCompare !== 0) {
      return dueCompare;
    }
  } else if (a.due) {
    return -1;
  } else if (b.due) {
    return 1;
  }

  return a.title.localeCompare(b.title);
}

export function TasksCard({
  tasks,
  taskLists,
  loading,
  error,
  isAuthorized,
  taskDayTimezone = DEFAULT_TASK_DAY_TIMEZONE,
  onToggleTaskCompleted,
}: {
  tasks: Task[];
  taskLists: GoogleTaskList[];
  loading: boolean;
  error: Error | null;
  isAuthorized: boolean;
  taskDayTimezone?: string;
  onToggleTaskCompleted?: (task: Task) => Promise<void>;
}) {
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const todaysTasks = useMemo(() => {
    const dayBoundary = getTaskDayBoundary(new Date(), taskDayTimezone);
    const taskCalendarDate = getTaskCalendarDate(new Date(), taskDayTimezone);
    return tasks.filter((task) =>
      isDashboardTaskVisible(task, { taskCalendarDate, dayBoundary })
    );
  }, [taskDayTimezone, tasks]);

  const columns = useMemo(() => {
    return taskLists.map((list) => ({
      list,
      tasks: todaysTasks
        .filter((task) => task.taskListId === list.id)
        .sort(sortTasks),
    }));
  }, [taskLists, todaysTasks]);

  async function handleToggle(task: Task) {
    if (!onToggleTaskCompleted) {
      return;
    }

    const key = `${task.taskListId}:${task.id}`;
    setTogglingIds((current) => new Set(current).add(key));

    try {
      await onToggleTaskCompleted(task);
    } finally {
      setTogglingIds((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckSquare className="size-4" />
          Tasks
        </CardTitle>
        <CardDescription>
          Today, overdue, and undated — plus tasks completed since 4:00 AM
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isAuthorized && (
          <p className="text-sm text-muted-foreground">
            Connect Google Calendar & Tasks to see your list. Reconnect if you
            previously connected, so task completion is allowed.
          </p>
        )}
        {isAuthorized && loading && (
          <p className="text-sm text-muted-foreground">Loading tasks…</p>
        )}
        {isAuthorized && error && (
          <p className="mb-3 text-sm text-destructive">{error.message}</p>
        )}
        {isAuthorized && !loading && taskLists.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">
            No task lists found on this Google account.
          </p>
        )}
        {isAuthorized && !loading && taskLists.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-1">
            {columns.map(({ list, tasks: listTasks }) => (
              <div
                key={list.id}
                className="min-w-[220px] flex-1 space-y-3 rounded-lg border bg-muted/20 p-3"
              >
                <h3 className="truncate text-sm font-semibold">{list.title}</h3>
                {listTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No tasks today</p>
                ) : (
                  <ul className="space-y-3">
                    {listTasks.map((task) => {
                      const key = `${task.taskListId}:${task.id}`;
                      const busy = togglingIds.has(key);

                      return (
                        <li key={key} className="flex items-start gap-2.5">
                          <Checkbox
                            className="mt-0.5"
                            checked={task.completed}
                            disabled={busy || !onToggleTaskCompleted}
                            onCheckedChange={() => {
                              void handleToggle(task);
                            }}
                            aria-label={
                              task.completed
                                ? `Mark ${task.title} incomplete`
                                : `Complete ${task.title}`
                            }
                          />
                          <div className="min-w-0">
                            <p
                              className={
                                task.completed
                                  ? "text-sm font-medium leading-tight text-muted-foreground line-through"
                                  : "text-sm font-medium leading-tight"
                              }
                            >
                              {task.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDue(task)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
