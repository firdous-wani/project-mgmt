import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ProjectDetails from '@/pages/dashboard/projects/[id]';
import { api } from '@/utils/api';

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    query: {
      id: 'test-project-id',
    },
  }),
}));

// Mock Next.js session
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        name: 'Test User',
        email: 'test@example.com',
      },
    },
    status: 'authenticated',
  }),
}));

// Mock the API
vi.mock('@/utils/api', () => ({
  api: {
    useUtils: vi.fn(() => ({
      project: {
        getById: {
          invalidate: vi.fn(),
        },
        update: {
          invalidate: vi.fn(),
        },
        delete: {
          invalidate: vi.fn(),
        },
      },
      task: {
        getByProject: {
          invalidate: vi.fn(),
        },
        create: {
          invalidate: vi.fn(),
        },
        update: {
          invalidate: vi.fn(),
        },
        delete: {
          invalidate: vi.fn(),
        },
      },
    })),
    project: {
      getById: {
        useQuery: vi.fn(() => ({
          data: {
            id: 'test-project-id',
            title: 'Test Project',
            description: 'Test Description',
            status: 'IN_PROGRESS',
            createdAt: new Date(),
            updatedAt: new Date(),
            tasks: [],
            team: [],
          },
          isLoading: false,
        })),
      },
      update: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
          isLoading: false,
        })),
      },
      delete: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
          isLoading: false,
        })),
      },
    },
    task: {
      create: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
          isLoading: false,
        })),
      },
      update: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
          isLoading: false,
        })),
      },
      delete: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
          isLoading: false,
        })),
      },
      getByProject: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
        })),
      },
    },
    team: {
      getProjectMembers: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
        })),
      },
      inviteMember: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
          isLoading: false,
        })),
      },
    },
  },
}));

describe('ProjectDetails', () => {
  const mockProject = {
    id: 'test-project-id',
    name: 'Test Project',
    description: 'Test Description',
    status: 'IN_PROGRESS',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockTasks = [
    {
      id: 'test-task-1',
      title: 'Test Task 1',
      description: 'Test Description 1',
      status: 'todo',
      priority: 'medium',
      dueDate: new Date().toISOString(),
      assignee: {
        name: 'Test User',
        email: 'test@example.com',
      },
    },
  ];

  const mockMembers = [
    {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'owner',
      joinedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock data
    (api.project.getById.useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockProject,
      refetch: vi.fn(),
    });

    (api.task.getByProject.useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockTasks,
      refetch: vi.fn(),
    });

    (api.team.getProjectMembers.useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockMembers,
    });

    // Setup mock mutations
    (api.project.update.useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });

    (api.task.create.useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });

    (api.team.inviteMember.useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });
  });

  it('renders project details correctly', () => {
    render(<ProjectDetails />);
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument();
  });

  it('updates project status correctly', async () => {
    render(<ProjectDetails />);
    
    // Click the edit project button
    const editButton = screen.getByRole('button', { name: /edit project/i });
    fireEvent.click(editButton);
    
    // Change the status in the edit form
    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'completed' } });
    
    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);
  });
}); 