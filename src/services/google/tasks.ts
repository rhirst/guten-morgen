import { parseGoogleTaskDueDate } from "@/lib/google-dates";
import { googleFetch } from "./googleApi";
import type {
  GoogleTask,
  GoogleTaskList,
  GoogleTaskListsResponse,
  GoogleTasksResponse,
  Task,
} from "./tasks.types";

const TASKS_API = "https://tasks.googleapis.com/tasks/v1";

export async function getTaskLists(): Promise<GoogleTaskList[]> {
  const response = await googleFetch<GoogleTaskListsResponse>(
    `${TASKS_API}/users/@me/lists`
  );

  return response.items ?? [];
}

function normalizeTask(task: GoogleTask, taskListId: string): Task {
  return {
    id: task.id,
    taskListId,
    title: task.title,
    notes: task.notes,
    due: task.due ? parseGoogleTaskDueDate(task.due) : undefined,
    completed: task.status === "completed",
    completedAt: task.completed,
  };
}

async function listAllTasks(
  taskListId: string,
  baseParams: Record<string, string>
): Promise<GoogleTask[]> {
  const items: GoogleTask[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams(baseParams);
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await googleFetch<GoogleTasksResponse>(
      `${TASKS_API}/lists/${encodeURIComponent(taskListId)}/tasks?${params}`
    );

    items.push(...(response.items ?? []));
    pageToken = response.nextPageToken;
  } while (pageToken);

  return items;
}

/**
 * Fetch incomplete tasks plus tasks completed at/after `completedMin` (ISO).
 * `completedMin` alone would exclude needsAction tasks from the API.
 */
export async function getTasks(
  taskList: GoogleTaskList,
  completedMin: string
): Promise<Task[]> {
  const [openTasks, completedTasks] = await Promise.all([
    listAllTasks(taskList.id, {
      showCompleted: "false",
      maxResults: "100",
    }),
    listAllTasks(taskList.id, {
      showCompleted: "true",
      showHidden: "true",
      completedMin,
      maxResults: "100",
    }),
  ]);

  const byId = new Map<string, GoogleTask>();
  for (const task of openTasks) {
    byId.set(task.id, task);
  }
  for (const task of completedTasks) {
    byId.set(task.id, task);
  }

  return [...byId.values()].map((task) => normalizeTask(task, taskList.id));
}

export async function setTaskCompleted(
  taskListId: string,
  taskId: string,
  completed: boolean
): Promise<Task> {
  const response = await googleFetch<GoogleTask>(
    `${TASKS_API}/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        completed
          ? { status: "completed" }
          : { status: "needsAction", completed: null }
      ),
    }
  );

  return normalizeTask(response, taskListId);
}
