import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

interface Project {
  id: string;
  name: string;
}

const Team: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  // Fetch user's projects
  const { data: projects } = api.project.getAll.useQuery(undefined, {
    enabled: !!session?.user,
  });

  const inviteMember = api.team.inviteMember.useMutation({
    onSuccess: () => {
      setIsInviteModalOpen(false);
      setInviteEmail("");
      setInviteError(null);
      // TODO: Show success message
    },
    onError: (error) => {
      setInviteError(error.message);
    },
  });

  // Fetch team members when project is selected
  const { data: members } = api.team.getProjectMembers.useQuery(
    { projectId: selectedProjectId ?? "" },
    { enabled: !!selectedProjectId }
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (members) {
      setTeamMembers(members);
    }
  }, [members]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setIsInviting(true);

    if (!selectedProjectId) {
      setInviteError("No project selected");
      setIsInviting(false);
      return;
    }

    try {
      await inviteMember.mutateAsync({ 
        email: inviteEmail,
        projectId: selectedProjectId,
      });
    } finally {
      setIsInviting(false);
    }
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
          <h1 className="text-2xl font-semibold text-gray-900">Team</h1>
          <div className="flex items-center space-x-4">
            <select
              value={selectedProjectId ?? ""}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">Select a project</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              disabled={!selectedProjectId}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Invite Member
            </button>
          </div>
        </div>

        {!selectedProjectId ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">No Project Selected</h2>
              <p className="mt-2 text-gray-600">Please select a project to manage team members.</p>
            </div>
          </div>
        ) : (
          /* Team Members List */
          <div className="overflow-hidden rounded-lg bg-white shadow">
            {teamMembers.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No team members found. Invite your first team member to get started.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {teamMembers.map((member) => (
                  <li key={member.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200" />
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {member.name}
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
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                        <button className="text-sm text-gray-500 hover:text-gray-700">
                          Edit
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Invite Member Modal */}
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setIsInviteModalOpen(false)}
              />
              <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
                <form onSubmit={handleInviteMember}>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter email address"
                      required
                    />
                    {inviteError && (
                      <p className="mt-2 text-sm text-red-600">{inviteError}</p>
                    )}
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      disabled={isInviting}
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isInviting ? "Sending..." : "Send Invitation"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInviteModalOpen(false)}
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
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

export default Team; 