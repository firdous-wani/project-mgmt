import { useState } from 'react';
import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { User } from '@/types/user';

interface TaskFormProps {
  task?: Task;
  members?: User[];
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
}

export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string;
}

export function TaskForm({ task, members, onSubmit, onCancel }: TaskFormProps) {
  const defaultDate = new Date().toISOString().split('T')[0];
  const taskDueDate = task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : defaultDate;
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    dueDate: taskDueDate as string,
    assigneeId: task?.assigneeId || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700">Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700">Due Date</label>
        <input
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700">Assignee</label>
        <select
          value={formData.assigneeId}
          onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">Unassigned</option>
          {members?.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name || member.email}
            </option>
          ))}
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
          {task ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  );
} 