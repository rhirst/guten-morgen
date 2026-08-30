import { googleFetch } from "./googleApi";
import type {
  GoogleTask,
  GoogleTaskList,
  GoogleTaskListsResponse,
  GoogleTasksResponse,
  Task,
} from "./tasks.types";

const TASKS_API =
  "https://tasks.googleapis.com/tasks/v1";

export async function getTaskLists(): Promise<GoogleTaskList[]> {
  const response =
    await googleFetch<GoogleTaskListsResponse>(
      `${TASKS_API}/users/@me/lists`
    );

  return response.items ?? [];
}

function normalizeTask(
  task: GoogleTask,
  taskListId: string
): Task {
  return {
    id: task.id,
    taskListId,

    title: task.title,
    notes: task.notes,

    due: task.due ? new Date(task.due) : undefined,

    completed: task.status === "completed",
  };
}

export async function getTasks(
  taskList: GoogleTaskList
): Promise<Task[]> {
  const params = new URLSearchParams({
    showCompleted: "false",
    showHidden: "false",
    maxResults: "100",
  });

  const response =
    await googleFetch<GoogleTasksResponse>(
      `${TASKS_API}/lists/${encodeURIComponent(
        taskList.id
      )}/tasks?${params}`
    );

  return (response.items ?? []).map((task) =>
    normalizeTask(task, taskList.id)
  );
}