import { Project } from './project';
import { User } from './user';

export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  assigneeId: string | null;
  project?: Project;
  assignee?: User;
} 