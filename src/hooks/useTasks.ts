import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getTaskLists,
  getTasks,
  setTaskCompleted,
} from "@/services/google/tasks";
import type { GoogleTaskList, Task } from "@/services/google/tasks.types";
import { useGoogleAuth } from "@/providers/GoogleAuthProvider";
import {
  filterByEnabledIds,
  isSourceEnabled,
} from "@/services/settings";

export function useTasks(enabledTaskListIds?: string[] | null) {
  const { isAuthorized } = useGoogleAuth();

  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthorized) {
      setTaskLists([]);
      setTasks([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const lists = await getTaskLists();

      setTaskLists(lists);

      const visibleLists = filterByEnabledIds(lists, enabledTaskListIds);

      const taskArrays = await Promise.all(
        visibleLists.map((list) => getTasks(list))
      );

      setTasks(taskArrays.flat());
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load tasks")
      );
    } finally {
      setLoading(false);
    }
  }, [enabledTaskListIds, isAuthorized]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleTaskCompleted = useCallback(async (task: Task) => {
    const nextCompleted = !task.completed;
    let snapshot: Task[] = [];

    setTasks((current) => {
      snapshot = current;
      return current.map((item) => {
        if (item.id !== task.id || item.taskListId !== task.taskListId) {
          return item;
        }

        return {
          ...item,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
      });
    });

    try {
      const updated = await setTaskCompleted(
        task.taskListId,
        task.id,
        nextCompleted
      );
      setTasks((current) =>
        current.map((item) =>
          item.id === updated.id && item.taskListId === updated.taskListId
            ? updated
            : item
        )
      );
    } catch (err) {
      setTasks(snapshot);
      const message =
        err instanceof Error ? err.message : "Failed to update task";
      setError(
        new Error(
          message.includes("403")
            ? "Task updates need updated Google permission. Disconnect and connect again."
            : message
        )
      );
      throw err;
    }
  }, []);

  const visibleTaskLists = useMemo(
    () =>
      taskLists.filter((list) =>
        isSourceEnabled(list.id, enabledTaskListIds)
      ),
    [enabledTaskListIds, taskLists]
  );

  return {
    taskLists,
    visibleTaskLists,
    tasks,
    loading,
    error,
    refresh,
    toggleTaskCompleted,
  };
}
