import { CheckSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GoogleTaskList, Task } from "@/services/google/tasks.types";

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isTaskForToday(task: Task, now = new Date()) {
  if (!task.due) {
    return true;
  }

  return isSameLocalDay(task.due, now);
}

function formatDue(task: Task) {
  if (!task.due) {
    return "No due date";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(task.due);
}

export function TasksCard({
  tasks,
  taskLists,
  loading,
  error,
  isAuthorized,
}: {
  tasks: Task[];
  taskLists: GoogleTaskList[];
  loading: boolean;
  error: Error | null;
  isAuthorized: boolean;
}) {
  const listNames = new Map(taskLists.map((list) => [list.id, list.title]));
  const todaysTasks = tasks.filter((task) => isTaskForToday(task));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckSquare className="size-4" />
          Tasks
        </CardTitle>
        <CardDescription>Open items due today, plus undated tasks</CardDescription>
      </CardHeader>
      <CardContent>
        {!isAuthorized && (
          <p className="text-sm text-muted-foreground">
            Connect Google Calendar & Tasks to see your list.
          </p>
        )}
        {isAuthorized && loading && (
          <p className="text-sm text-muted-foreground">Loading tasks…</p>
        )}
        {isAuthorized && error && (
          <p className="text-sm text-destructive">{error.message}</p>
        )}
        {isAuthorized && !loading && !error && todaysTasks.length === 0 && (
          <p className="text-sm text-muted-foreground">No open tasks for today.</p>
        )}
        {isAuthorized && !loading && todaysTasks.length > 0 && (
          <ul className="space-y-3">
            {todaysTasks.map((task) => (
              <li key={`${task.taskListId}-${task.id}`}>
                <p className="text-sm font-medium leading-tight">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDue(task)}
                  {listNames.get(task.taskListId)
                    ? ` · ${listNames.get(task.taskListId)}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
