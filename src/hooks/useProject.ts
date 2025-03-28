import { useState } from 'react';
import { api } from '@/utils/api';
import { Project, ProjectStatus } from '@/types/project';

interface CreateProjectData {
  name: string;
  description?: string;
  status?: "active" | "completed" | "archived";
}

interface UpdateProjectData {
  id: string;
  name?: string;
  description?: string;
  status?: "active" | "completed" | "archived";
}

export function useProject() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const utils = api.useContext();
  const { data: projects, isLoading: isLoadingProjects } = api.project.getAll.useQuery();

  const createProjectMutation = api.project.create.useMutation({
    onSuccess: () => {
      utils.project.getAll.invalidate();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const updateProjectMutation = api.project.update.useMutation({
    onSuccess: () => {
      utils.project.getAll.invalidate();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const deleteProjectMutation = api.project.delete.useMutation({
    onSuccess: () => {
      utils.project.getAll.invalidate();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const createProject = async (data: CreateProjectData) => {
    setIsLoading(true);
    setError(null);
    try {
      await createProjectMutation.mutateAsync(data);
    } catch (err) {
      // Error is handled by the mutation
    } finally {
      setIsLoading(false);
    }
  };

  const updateProject = async (data: UpdateProjectData) => {
    setIsLoading(true);
    setError(null);
    try {
      await updateProjectMutation.mutateAsync(data);
    } catch (err) {
      // Error is handled by the mutation
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteProjectMutation.mutateAsync({ id: projectId });
    } catch (err) {
      // Error is handled by the mutation
    } finally {
      setIsLoading(false);
    }
  };

  return {
    projects,
    isLoading: isLoading || isLoadingProjects,
    error,
    createProject,
    updateProject,
    deleteProject,
  };
} 