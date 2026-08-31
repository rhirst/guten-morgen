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
  };
}

export async function getTasks(taskList: GoogleTaskList): Promise<Task[]> {
  const items: GoogleTask[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      showCompleted: "false",
      showHidden: "false",
      maxResults: "100",
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await googleFetch<GoogleTasksResponse>(
      `${TASKS_API}/lists/${encodeURIComponent(taskList.id)}/tasks?${params}`
    );

    items.push(...(response.items ?? []));
    pageToken = response.nextPageToken;
  } while (pageToken);

  return items.map((task) => normalizeTask(task, taskList.id));
}

export async function completeTask(
  taskListId: string,
  taskId: string
): Promise<Task> {
  const response = await googleFetch<GoogleTask>(
    `${TASKS_API}/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "completed" }),
    }
  );

  return normalizeTask(response, taskListId);
}
