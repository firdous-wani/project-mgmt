import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import {
  UserCircleIcon,
  EnvelopeIcon,
  KeyIcon,
  BellIcon,
  GlobeAltIcon,
  CalendarIcon,
  ShieldCheckIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@supabase/supabase-js";
import { toast } from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import { TRPCClientErrorLike } from "@trpc/client";
import { type AppRouter } from "@/server/api/root";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  timezone: string | null;
  notifications: {
    email: boolean;
    push: boolean;
    projectUpdates: boolean;
    taskUpdates: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const Profile: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    timezone: "",
    notifications: {
      email: true,
      push: true,
      projectUpdates: true,
      taskUpdates: true,
    },
  });

  const { data: userProfile, refetch } = api.users.getProfile.useQuery(
    undefined,
    {
      enabled: !!session?.user,
    }
  );

  const updateProfile = api.users.updateProfile.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      void refetch();
      toast.success("Profile updated successfully");
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session?.user) {
    void router.push("/auth/signin");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const getAvatarUrl = (name: string | null) => {
    const initial = getInitials(name);
    return `https://api.dicebear.com/7.x/initials/svg?seed=${initial}&backgroundColor=4f46e5&textColor=ffffff`;
  };

  if (!userProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
        <div className="space-y-6">
        <Toaster position="top-right" />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Profile Information */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Profile Information
              </h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Edit Profile
              </button>
            )}
          </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                    required
                    value={formData.name}
                  onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                  }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="timezone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Timezone
                </label>
                <select
                  id="timezone"
                    value={formData.timezone}
                  onChange={(e) =>
                      setFormData({ ...formData, timezone: e.target.value })
                  }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                    <option value="">Select a timezone</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
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
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="relative h-20 w-20">
                    <img
                      src={getAvatarUrl(userProfile.name)}
                      alt="Profile"
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {userProfile.name || "Unnamed User"}
                    </h3>
                    <p className="text-sm text-gray-500">{userProfile.email}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Timezone</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {userProfile.timezone || "Not set"}
                  </p>
                </div>
                </div>
              )}
          </div>

          {/* Notification Preferences */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">
              Notification Preferences
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Email Notifications
                  </h3>
                  <p className="text-sm text-gray-500">
                    Receive updates via email
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={formData.notifications.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications: {
                          ...formData.notifications,
                          email: e.target.checked,
                        },
                      })
                    }
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Push Notifications
                  </h3>
                  <p className="text-sm text-gray-500">
                    Receive push notifications
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={formData.notifications.push}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications: {
                          ...formData.notifications,
                          push: e.target.checked,
                        },
                      })
                    }
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Project Updates
                  </h3>
                  <p className="text-sm text-gray-500">
                    Get notified about project changes
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={formData.notifications.projectUpdates}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications: {
                          ...formData.notifications,
                          projectUpdates: e.target.checked,
                        },
                      })
                    }
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Task Updates
                  </h3>
                  <p className="text-sm text-gray-500">
                    Get notified about task changes
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={formData.notifications.taskUpdates}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications: {
                          ...formData.notifications,
                          taskUpdates: e.target.checked,
                        },
                      })
                    }
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile; 