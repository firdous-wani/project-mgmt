import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import {
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";

interface Project {
  id: string;
  name: string;
  description: string | null;
  members: {
    id: string;
    projectId: string;
    userId: string;
    role: string;
    joinedAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string | null;
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const Projects: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
  });

  // Fetch projects
  const { data: projects, refetch: refetchProjects } = api.project.getAll.useQuery(
    undefined,
    { enabled: !!session }
  );

  // Create project mutation
  const createProject = api.project.create.useMutation({
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setNewProject({ name: "", description: "" });
      refetchProjects();
    },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;

    createProject.mutate({
      name: newProject.name,
      description: newProject.description,
    });
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and collaborate on your projects
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            New Project
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project: Project) => (
            <div
              key={project.id}
              className="group relative overflow-hidden rounded-lg bg-white shadow transition-all hover:shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {project.name}
                  </h3>
                  <button
                    onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                  {project.description || "No description"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    <UserGroupIcon className="mr-1 h-4 w-4" />
                    {project.members.length} members
                  </div>
                  <div className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                    <CalendarIcon className="mr-1 h-4 w-4" />
                    Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                  </div>
                  <div className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    <ClockIcon className="mr-1 h-4 w-4" />
                    Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex -space-x-2">
                    {project.members.slice(0, 5).map((member) => (
                      <div
                        key={member.user.id}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 ring-2 ring-white"
                      >
                        {member.user.name?.[0] || member.user.email?.[0] || "?"}
                      </div>
                    ))}
                    {project.members.length > 5 && (
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 ring-2 ring-white">
                        +{project.members.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Project Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setIsCreateModalOpen(false)}
              />
              <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
                <form onSubmit={handleCreateProject}>
                  <div>
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Create New Project
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by filling in the information below to create your new project.
                    </p>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Project Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={newProject.name}
                        onChange={(e) =>
                          setNewProject({ ...newProject, name: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Enter project name"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Description
                      </label>
                      <textarea
                        id="description"
                        value={newProject.description}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Enter project description"
                      />
                    </div>
                  </div>
                  <div className="mt-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Create Project
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Projects; 