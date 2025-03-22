import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    query: { id: 'test-project-id' },
  }),
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    },
    status: 'authenticated',
  }),
}));

// Mock tRPC API
vi.mock('@/utils/api', () => ({
  api: {
    project: {
      getById: {
        useQuery: () => ({
          data: {
            id: 'test-project-id',
            name: 'Test Project',
            description: 'Test Description',
            status: 'IN_PROGRESS',
            tasks: [],
            members: [],
          },
          isLoading: false,
        }),
      },
      updateStatus: {
        useMutation: () => ({
          mutate: vi.fn(),
          isLoading: false,
        }),
      },
    },
    task: {
      create: {
        useMutation: () => ({
          mutate: vi.fn(),
          isLoading: false,
        }),
      },
    },
    team: {
      inviteMember: {
        useMutation: () => ({
          mutate: vi.fn(),
          isLoading: false,
        }),
      },
    },
  },
})); 