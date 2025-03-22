import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import { formatDistanceToNow } from "date-fns";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  UserPlusIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  XCircleIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { Toaster } from "react-hot-toast";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: Date | null;
  assignee: {
    name: string | null;
    email: string | null;
  } | null;
  assigneeId: string | null;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
}

interface ProjectMember {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  joinedAt: string;
}

interface EditingProject {
  name: string;
  description: string;
  status: "active" | "completed" | "archived";
}

interface EditingTask {
  title: string;
  description: string;
  status: "todo" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string;
  assigneeId: string;
}

const ProjectDetails: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const projectId = router.query.id as string;
  const utils = api.useUtils();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    status: "todo" | "in-progress" | "completed";
    priority: "low" | "medium" | "high";
    dueDate: string;
    assigneeId: string;
  }>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
    assigneeId: "",
  });
  const [taskError, setTaskError] = useState<string | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isTaskEditing, setIsTaskEditing] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<EditingProject>({
    name: "",
    description: "",
    status: "active",
  });
  const [editingTask, setEditingTask] = useState<EditingTask>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
    assigneeId: "",
  });

  // Fetch project details
  const { data: project, refetch: refetchProject } = api.project.getById.useQuery(
    { id: projectId },
    { enabled: !!projectId }
  );

  // Fetch project tasks
  const { data: tasks, refetch: refetchTasks } = api.task.getByProject.useQuery(
    { projectId },
    { enabled: !!projectId }
  ) as { data: Task[] | undefined; refetch: () => Promise<unknown> };

  // Fetch project members
  const { data: members } = api.team.getProjectMembers.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  // Invite member mutation
  const inviteMember = api.team.inviteMember.useMutation({
    onSuccess: () => {
      setInviteEmail("");
      setInviteRole("MEMBER");
      setIsInviteModalOpen(false);
      setInviteSuccess(true);
      setInviteError(null);
      // Reset success message after 3 seconds
      setTimeout(() => setInviteSuccess(false), 3000);
    },
    onError: (error) => {
      if (error.message === "User already exists") {
        setInviteError("This user already has an account. They can join the project directly.");
      } else {
        setInviteError(error.message);
      }
    },
  });

  const createTask = api.task.create.useMutation({
    onSuccess: () => {
      setIsNewTaskModalOpen(false);
      setNewTask({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
        assigneeId: "",
      });
      setTaskError(null);
      refetchTasks();
      toast.success("Task created successfully");
    },
    onError: (error) => {
      setTaskError(error.message);
      toast.error(error.message || "Error creating task");
    },
  });

  const updateProject = api.project.update.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      void refetchProject();
      toast.success("Project updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update project");
    },
  });

  const deleteProject = api.project.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted successfully");
      void router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete project");
    },
  });

  const updateTask = api.task.update.useMutation({
    onSuccess: () => {
      setIsTaskEditing(null);
      void refetchTasks();
      toast.success("Task updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update task");
    },
  });

  const deleteTask = api.task.delete.useMutation({
    onSuccess: () => {
      void refetchTasks();
      toast.success("Task deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete task");
    },
  });

  const handleProjectStatusChange = (newStatus: "active" | "completed" | "archived") => {
    if (!projectId || typeof projectId !== "string") return;
    updateProject.mutate({
      id: projectId,
      status: newStatus,
    });
  };

  const handleTaskStatusChange = (taskId: string, newStatus: "todo" | "in-progress" | "completed") => {
    console.log("Updating task status:", taskId, newStatus);
    updateTask.mutate({
      id: taskId,
      status: newStatus,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "todo":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "todo":
        return <ClockIcon className="h-4 w-4" />;
      case "completed":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "archived":
        return <ArchiveBoxIcon className="h-4 w-4" />;
      case "in-progress":
        return <ArrowPathIcon className="h-4 w-4" />;
      default:
        return <XCircleIcon className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading" || !project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const handleInvite = async () => {
    if (!inviteEmail || !inviteRole) return;
    await inviteMember.mutateAsync({
      projectId,
      email: inviteEmail,
      role: inviteRole as "MEMBER" | "ADMIN",
    });
    setInviteEmail("");
    setInviteRole("MEMBER");
    setIsInviteModalOpen(false);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskError(null);
    setIsCreatingTask(true);

    try {
      await createTask.mutateAsync({
        ...newTask,
        projectId,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
        assigneeId: newTask.assigneeId || undefined,
      });
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleProjectUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    updateProject.mutate({
      id: project.id,
      name: editingProject.name,
      description: editingProject.description,
      status: editingProject.status,
    });
  };

  const handleStartEditing = () => {
    if (!project) return;
    setEditingProject({
      name: project.name,
      description: project.description || "",
      status: project.status as "active" | "completed" | "archived",
    });
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
  };

  const handleProjectDelete = () => {
    if (!project) return;
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      deleteProject.mutate({ id: project.id });
    }
  };

  const handleTaskUpdate = (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    updateTask.mutate({
      id: taskId,
      title: editingTask.title,
      description: editingTask.description,
      status: editingTask.status,
      priority: editingTask.priority,
      dueDate: editingTask.dueDate ? new Date(editingTask.dueDate) : undefined,
      assigneeId: editingTask.assigneeId || undefined,
    });
  };

  const handleTaskDelete = (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      deleteTask.mutate({ id: taskId });
    }
  };

  const handleStartTaskEditing = (task: Task) => {
    const formattedDueDate = task.dueDate?.toISOString().split("T")[0] ?? "";
    const formattedAssigneeId = task.assigneeId ?? "";

    setEditingTask({
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      dueDate: formattedDueDate,
      assigneeId: formattedAssigneeId,
    });
    setIsTaskEditing(task.id);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <Toaster position="top-right" />
        
        {/* Project Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isEditing ? (
                <form onSubmit={handleProjectUpdate} className="space-y-3">
                  <input
                    type="text"
                    value={editingProject.name}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, name: e.target.value })
                    }
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <textarea
                    value={editingProject.description}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, description: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <select
                    value={editingProject.status}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        status: e.target.value as "active" | "completed" | "archived",
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleCancelEditing}
                      className="rounded-md bg-gray-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
                  <p className="mt-1 text-sm text-gray-600">{project.description}</p>
                  <span
                    className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      project.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : project.status === "archived"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                </>
              )}
            </h1>
          </div>
          <div className="flex space-x-3">
            {!isEditing ? (
              <>
                <button
                  onClick={handleStartEditing}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Edit Project
                </button>
                <button
                  onClick={handleProjectDelete}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  Delete Project
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* Project Statistics */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-3 shadow">
            <h3 className="text-xs font-medium text-gray-500">Total Tasks</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {tasks?.length ?? 0}
            </p>
          </div>
          <div className="rounded-lg bg-white p-3 shadow">
            <h3 className="text-xs font-medium text-gray-500">Team Members</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {members?.length ?? 0}
            </p>
          </div>
          <div className="rounded-lg bg-white p-3 shadow">
            <h3 className="text-xs font-medium text-gray-500">Created</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="rounded-lg bg-white p-3 shadow">
            <h3 className="text-xs font-medium text-gray-500">Last Updated</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">Tasks</h2>
            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              Add Task
            </button>
          </div>

          {/* Task List */}
          <div className="mt-4 space-y-4">
            {tasks?.map((task: Task) => (
              <div
                key={task.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                {isTaskEditing === task.id ? (
                  <form onSubmit={(e) => handleTaskUpdate(e, task.id)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editingTask.title}
                        onChange={(e) =>
                          setEditingTask({ ...editingTask, title: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        value={editingTask.description}
                        onChange={(e) =>
                          setEditingTask({ ...editingTask, description: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <select
                          value={editingTask.status}
                          onChange={(e) =>
                            setEditingTask({ ...editingTask, status: e.target.value as any })
                          }
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        >
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Priority
                        </label>
                        <select
                          value={editingTask.priority}
                          onChange={(e) =>
                            setEditingTask({ ...editingTask, priority: e.target.value as any })
                          }
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={editingTask.dueDate}
                        onChange={(e) =>
                          setEditingTask({ ...editingTask, dueDate: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Assignee
                      </label>
                      <select
                        value={editingTask.assigneeId}
                        onChange={(e) =>
                          setEditingTask({ ...editingTask, assigneeId: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value="">Unassigned</option>
                        {members?.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name ?? member.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setIsTaskEditing(null)}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {task.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            task.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : task.status === "in-progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {task.status === "completed"
                            ? "Completed"
                            : task.status === "in-progress"
                            ? "In Progress"
                            : "To Do"}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            task.priority === "high"
                              ? "bg-red-100 text-red-800"
                              : task.priority === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                        {task.dueDate && (
                          <span className="text-sm text-gray-500">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {task.assignee && (
                          <span className="text-sm text-gray-500">
                            Assigned to: {task.assignee.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStartTaskEditing(task)}
                        className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleTaskDelete(task.id)}
                        className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Team Members */}
        <div className="rounded-lg bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Team Members</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {members?.map((member) => (
              <div key={member.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        {member.name ?? member.email}
                      </h3>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        member.role === "owner"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {member.role}
                    </span>
                    <span className="text-sm text-gray-500">
                      Joined {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invite Member Modal */}
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteError(null);
                  setInviteSuccess(false);
                }}
              />
              <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Invite Team Member
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Send an invitation to join your project team.
                  </p>
                </div>
                <form onSubmit={handleInvite} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email Address
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        id="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Role
                    </label>
                    <select
                      id="role"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as "MEMBER" | "ADMIN")}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  {inviteError && (
                    <div className="rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <ExclamationCircleIcon
                            className="h-5 w-5 text-red-400"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">
                            {inviteError}
                          </h3>
                        </div>
                      </div>
                    </div>
                  )}

                  {inviteSuccess && (
                    <div className="rounded-md bg-green-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <CheckCircleIcon
                            className="h-5 w-5 text-green-400"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">
                            Invitation sent successfully!
                          </h3>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Send Invitation
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsInviteModalOpen(false);
                        setInviteError(null);
                        setInviteSuccess(false);
                      }}
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

        {/* New Task Modal */}
        {isNewTaskModalOpen && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setIsNewTaskModalOpen(false)}
              />
              <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
                <form onSubmit={handleCreateTask}>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Enter task title"
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
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Enter task description"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="status"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Status
                      </label>
                      <select
                        id="status"
                        value={newTask.status}
                        onChange={(e) => setNewTask({ ...newTask, status: e.target.value as "todo" | "in-progress" | "completed" })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="priority"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Priority
                      </label>
                      <select
                        id="priority"
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as "low" | "medium" | "high" })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="dueDate"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Due Date
                      </label>
                      <input
                        type="date"
                        id="dueDate"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="assignee"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Assignee
                      </label>
                      <select
                        id="assignee"
                        value={newTask.assigneeId}
                        onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="">Unassigned</option>
                        {members?.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name ?? member.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    {taskError && (
                      <p className="text-sm text-red-600">{taskError}</p>
                    )}
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      disabled={isCreatingTask}
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingTask ? "Creating..." : "Create Task"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNewTaskModalOpen(false)}
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
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

export default ProjectDetails; 