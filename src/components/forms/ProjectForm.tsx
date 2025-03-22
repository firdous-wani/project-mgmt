import { useState } from 'react';
import { Project, ProjectStatus } from '@/types/project';

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
}

export interface ProjectFormData {
  name: string;
  description: string;
  status: ProjectStatus;
}

export function ProjectForm({ project, onSubmit, onCancel }: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700">Status</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {project ? 'Save Changes' : 'Create Project'}
        </button>
      </div>
    </form>
  );
} 