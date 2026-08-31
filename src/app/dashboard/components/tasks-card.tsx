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
  formatDateOnlyLabel,
  formatLocalDate,
  isSameDateString,
} from "@/lib/google-dates";
import type { GoogleTaskList, Task } from "@/services/google/tasks.types";

export function isTaskForToday(task: Task, today = formatLocalDate()) {
  if (!task.due) {
    return true;
  }

  return isSameDateString(task.due, today);
}

function formatDue(task: Task) {
  if (!task.due) {
    return "No due date";
  }

  return formatDateOnlyLabel(task.due);
}

function sortTasks(a: Task, b: Task) {
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
  onCompleteTask,
}: {
  tasks: Task[];
  taskLists: GoogleTaskList[];
  loading: boolean;
  error: Error | null;
  isAuthorized: boolean;
  onCompleteTask?: (task: Task) => Promise<void>;
}) {
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());

  const todaysTasks = useMemo(
    () => tasks.filter((task) => isTaskForToday(task)),
    [tasks]
  );

  const columns = useMemo(() => {
    return taskLists.map((list) => ({
      list,
      tasks: todaysTasks
        .filter((task) => task.taskListId === list.id)
        .sort(sortTasks),
    }));
  }, [taskLists, todaysTasks]);

  async function handleComplete(task: Task) {
    if (!onCompleteTask) {
      return;
    }

    const key = `${task.taskListId}:${task.id}`;
    setCompletingIds((current) => new Set(current).add(key));

    try {
      await onCompleteTask(task);
    } finally {
      setCompletingIds((current) => {
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
          Open items due today, plus undated tasks — grouped by list
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
                      const busy = completingIds.has(key);

                      return (
                        <li key={key} className="flex items-start gap-2.5">
                          <Checkbox
                            className="mt-0.5"
                            checked={false}
                            disabled={busy || !onCompleteTask}
                            onCheckedChange={() => {
                              void handleComplete(task);
                            }}
                            aria-label={`Complete ${task.title}`}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-tight">
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
