import { Task } from './task';
import { User } from './user';

export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  owner?: User;
  tasks?: Task[];
  members?: User[];
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'owner' | 'member';
  joinedAt: Date;
  user?: User;
  project?: Project;
} 