export type Priority = 'low' | 'medium' | 'high';
export type FilterType = 'all' | 'active' | 'completed';
export type SortType = 'created' | 'priority' | 'dueDate';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: number;
  priority: Priority;
  dueDate: string | null; // ISO date string YYYY-MM-DD
}

export interface DeletedTodo {
  todo: Todo;
  timestamp: number;
}