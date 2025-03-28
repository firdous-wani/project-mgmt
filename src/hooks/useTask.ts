import { useState } from 'react';
import { api } from '@/utils/api';
import { Task, TaskStatus, TaskPriority } from '@/types/task';

interface UseTaskOptions {
  projectId: string;
}

interface CreateTaskData {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  assigneeId?: string;
}

interface UpdateTaskData extends Partial<CreateTaskData> {
  id: string;
}

export function useTask({ projectId }: UseTaskOptions) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const utils = api.useContext();
  const { data: tasks, isLoading: isLoadingTasks } = api.task.getByProject.useQuery({ projectId });

  const createTaskMutation = api.task.create.useMutation({
    onSuccess: () => {
      utils.task.getByProject.invalidate({ projectId });
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const updateTaskMutation = api.task.update.useMutation({
    onSuccess: () => {
      utils.task.getByProject.invalidate({ projectId });
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const deleteTaskMutation = api.task.delete.useMutation({
    onSuccess: () => {
      utils.task.getByProject.invalidate({ projectId });
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const createTask = async (data: CreateTaskData) => {
    setIsLoading(true);
    setError(null);
    try {
      await createTaskMutation.mutateAsync({
        ...data,
        projectId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      });
    } catch (err) {
      // Error is handled by the mutation
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async (data: UpdateTaskData) => {
    setIsLoading(true);
    setError(null);
    try {
      await updateTaskMutation.mutateAsync({
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      });
    } catch (err) {
      // Error is handled by the mutation
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteTaskMutation.mutateAsync({ id: taskId });
    } catch (err) {
      // Error is handled by the mutation
    } finally {
      setIsLoading(false);
    }
  };

  return {
    tasks,
    isLoading: isLoading || isLoadingTasks,
    error,
    createTask,
    updateTask,
    deleteTask,
  };
} 