export type GoogleTaskList = {
    id: string;
    title: string;
  };
  
  export type GoogleTaskListsResponse = {
    items?: GoogleTaskList[];
    nextPageToken?: string;
  };
  
  export type GoogleTask = {
    id: string;
    title: string;
    notes?: string;
    due?: string;
    status: "needsAction" | "completed";
    completed?: string;
  };
  
  export interface GoogleTasksResponse {
    items?: GoogleTask[];
    nextPageToken?: string;
  }
  
  export type Task = {
    id: string;
    taskListId: string;
  
    title: string;
    notes?: string;
  
    due?: string | undefined;
  
    completed: boolean;
  };