import { Project } from './project';
import { Task } from './task';

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  projects?: Project[];
  assignedTasks?: Task[];
  timezone?: string;
  notificationPreferences?: {
    email: boolean;
    push: boolean;
  };
} 