import { type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import {
  HomeIcon,
  FolderIcon,
  UserGroupIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Overview", href: "/dashboard", icon: HomeIcon },
  { name: "Projects", href: "/dashboard/projects", icon: FolderIcon },
  { name: "Team", href: "/dashboard/team", icon: UserGroupIcon },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const router = useRouter();
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center justify-center border-b border-gray-200">
          <span className="text-xl font-bold text-indigo-600">ProjectMgr</span>
        </div>
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive
                        ? "text-indigo-600"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="absolute bottom-0 w-full border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {session.user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500">{session.user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-gray-900">
              {navigation.find((item) => item.href === router.pathname)?.name || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/profile"
              className={`flex items-center text-sm font-medium ${
                router.pathname === "/dashboard/profile"
                  ? "text-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <UserCircleIcon className="mr-2 h-5 w-5" />
              Profile
            </Link>
            <button
              onClick={() => signOut()}
              className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftOnRectangleIcon className="mr-2 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Page Content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 