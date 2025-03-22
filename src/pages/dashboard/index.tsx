import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import {
  ChartBarIcon,
  ClockIcon,
  ListBulletIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  FolderIcon,
  XCircleIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  projectId: string;
  assigneeId: string | null;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  project: {
    id: string;
    name: string;
  };
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  members: Array<{
    id: string;
    userId: string;
    projectId: string;
    role: string;
    joinedAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string | null;
    };
  }>;
}

const Dashboard: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Fetch data
  const { data: projects } = api.project.getAll.useQuery();
  const { data: tasks, refetch: refetchTasks } = api.task.getAssigned.useQuery();
  const updateTask = api.task.update.useMutation({
    onSuccess: () => {
      refetchTasks();
    },
  });

  const handleTaskStatusChange = (taskId: string, newStatus: "todo" | "in-progress" | "completed") => {
    updateTask.mutate({
      id: taskId,
      status: newStatus,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "todo":
        return <ClockIcon className="h-4 w-4" />;
      case "completed":
        return <CheckCircleIcon className="h-4 w-4" />;
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

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  // Calculate statistics
  const totalProjects = projects?.length ?? 0;
  const completedProjects = projects?.filter((p) => p.status === "completed").length ?? 0;
  const totalTasks = tasks?.length ?? 0;
  const completedTasks = tasks?.filter((t) => t.status === "completed").length ?? 0;
  const inProgressTasks = tasks?.filter((t) => t.status === "in-progress").length ?? 0;

  // Prepare data for charts
  const projectStatusData = {
    labels: ["Active", "Completed", "Archived"],
    datasets: [
      {
        label: "Projects by Status",
        data: [
          projects?.filter((p) => p.status === "active").length ?? 0,
          completedProjects,
          projects?.filter((p) => p.status === "archived").length ?? 0,
        ],
        backgroundColor: [
          "rgba(59, 130, 246, 0.5)", // blue
          "rgba(34, 197, 94, 0.5)", // green
          "rgba(107, 114, 128, 0.5)", // gray
        ],
        borderColor: [
          "rgb(59, 130, 246)",
          "rgb(34, 197, 94)",
          "rgb(107, 114, 128)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const taskStatusData = {
    labels: ["To Do", "In Progress", "Completed"],
    datasets: [
      {
        label: "Tasks by Status",
        data: [
          tasks?.filter((t) => t.status === "todo").length ?? 0,
          inProgressTasks,
          completedTasks,
        ],
        backgroundColor: [
          "rgba(239, 68, 68, 0.5)", // red
          "rgba(234, 179, 8, 0.5)", // yellow
          "rgba(34, 197, 94, 0.5)", // green
        ],
        borderColor: [
          "rgb(239, 68, 68)",
          "rgb(234, 179, 8)",
          "rgb(34, 197, 94)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">
              Total Projects
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              {totalProjects}
            </dd>
          </div>
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">
              Completed Projects
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              {completedProjects}
            </dd>
          </div>
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">
              Total Tasks
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              {totalTasks}
            </dd>
          </div>
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">
              In Progress Tasks
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              {inProgressTasks}
            </dd>
          </div>
        </div>

        {/* Charts */}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Projects by Status
            </h3>
            <div className="mt-4 h-64">
              <Doughnut data={projectStatusData} options={chartOptions} />
            </div>
          </div>
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Tasks by Status
            </h3>
            <div className="mt-4 h-64">
              <Bar data={taskStatusData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="rounded-lg bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Projects</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {projects?.slice(0, 5).map((project) => (
              <div key={project.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{project.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{project.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        project.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : project.status === "archived"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {getStatusIcon(project.status)}
                      <span className="ml-1 capitalize">{project.status}</span>
                    </span>
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {(!projects || projects.length === 0) && (
              <div className="px-6 py-4 text-center text-gray-500">
                No projects found. Create your first project to get started.
              </div>
            )}
          </div>
        </div>

        {/* Assigned Tasks */}
        <div className="rounded-lg bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">My Tasks</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {tasks?.map((task) => (
              <div key={task.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                    <div className="mt-2 flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        Project: {task.project.name}
                      </span>
                      {task.dueDate && (
                        <span className="text-sm text-gray-500">
                          Due: {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        task.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : task.status === "in-progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {getStatusIcon(task.status)}
                      <span className="ml-1 capitalize">{task.status}</span>
                    </span>
                    <select
                      value={task.status}
                      onChange={(e) => handleTaskStatusChange(task.id, e.target.value as "todo" | "in-progress" | "completed")}
                      className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            {(!tasks || tasks.length === 0) && (
              <div className="px-6 py-4 text-center text-gray-500">
                No tasks assigned to you yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;