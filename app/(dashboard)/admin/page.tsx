"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type UserItem = {
  _id: string;
  email: string;
  role: "swimmer" | "coach" | "admin";
  isApproved?: boolean;
  profile?: {
    fullName?: string;
    callingName?: string;
  };
};

type PendingRequest = {
  _id: string;
  userId: string;
  userName?: string;
  type: "swimming" | "land";
  date: string;
  leaveType?: string;
  reason?: string;
  status: string;
};

type AnnouncementItem = {
  _id: string;
  title: string;
  content: string;
  priority: "low" | "medium" | "high";
  status?: "active" | "cancelled" | "completed";
  editedAt?: string;
  createdAt: string;
};

export default function AdminPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [overallStatsVisible, setOverallStatsVisible] = useState(false);
  const [aiGenerationEnabled, setAiGenerationEnabled] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("medium");
  const [isSaving, setIsSaving] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [isUpdatingAnnouncement, setIsUpdatingAnnouncement] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const sortedUsers = useMemo(() => {
    const getUserLabel = (user: UserItem) => {
      return (
        user.profile?.callingName ||
        user.profile?.fullName ||
        user.email ||
        ""
      )
        .trim()
        .toLowerCase();
    };

    return [...users].sort((a, b) =>
      getUserLabel(a).localeCompare(getUserLabel(b)),
    );
  }, [users]);

  const loadData = async () => {
    try {
      const [usersRes, attendanceRes, settingsRes, announcementsRes] =
        await Promise.all([
          fetch("/api/users"),
          fetch("/api/attendance"),
          fetch("/api/settings"),
          fetch("/api/announcements?limit=30"),
        ]);

      const usersData = await usersRes.json();
      const attendanceData = await attendanceRes.json();
      const settingsData = await settingsRes.json();
      const announcementsData = await announcementsRes.json();

      if (usersRes.ok) {
        setUsers(usersData.users || []);
      }

      if (attendanceRes.ok) {
        const pending = (attendanceData.records || []).filter(
          (record: PendingRequest) => record.status === "absent-requested",
        );
        setPendingRequests(pending);
      }

      if (settingsRes.ok) {
        setOverallStatsVisible(
          Boolean(settingsData?.settings?.overallStatsVisible),
        );
        setAiGenerationEnabled(
          settingsData?.settings?.aiGenerationEnabled !== false,
        );
      }

      if (announcementsRes.ok) {
        setAnnouncements(announcementsData?.announcements || []);
      }
    } catch {
      toast.error("Failed to load admin data");
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const onSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overallStatsVisible, aiGenerationEnabled }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to save settings");
        return;
      }

      toast.success("Settings updated");
    } catch {
      toast.error("Network error while saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const onApprove = async (attendanceId: string, approve: boolean) => {
    try {
      const response = await fetch("/api/attendance/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceId, approve }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to process request");
        return;
      }

      toast.success(approve ? "Request approved" : "Request rejected");
      await loadData();
    } catch {
      toast.error("Network error while updating request");
    }
  };

  const onPublishAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, priority }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to publish announcement");
        return;
      }

      toast.success("Announcement published");
      setTitle("");
      setContent("");
      setPriority("medium");
      await loadData();
    } catch {
      toast.error("Network error while publishing");
    } finally {
      setIsSaving(false);
    }
  };

  const onStartEditAnnouncement = (announcement: AnnouncementItem) => {
    setEditingAnnouncementId(announcement._id);
    setEditTitle(announcement.title);
    setEditContent(announcement.content);
    setEditPriority(announcement.priority);
  };

  const onCancelEditAnnouncement = () => {
    setEditingAnnouncementId("");
    setEditTitle("");
    setEditContent("");
    setEditPriority("medium");
  };

  const onSaveAnnouncementEdit = async () => {
    if (!editingAnnouncementId) {
      return;
    }

    if (!editTitle.trim() || !editContent.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setIsUpdatingAnnouncement(true);
    try {
      const response = await fetch("/api/announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcementId: editingAnnouncementId,
          title: editTitle,
          content: editContent,
          priority: editPriority,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to edit announcement");
        return;
      }

      toast.success("Announcement updated");
      onCancelEditAnnouncement();
      await loadData();
    } catch {
      toast.error("Network error while updating announcement");
    } finally {
      setIsUpdatingAnnouncement(false);
    }
  };

  const onSetApproval = async (userId: string, isApproved: boolean) => {
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isApproved }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update approval");
        return;
      }

      toast.success(isApproved ? "User approved" : "User set to pending");
      await loadData();
    } catch {
      toast.error("Network error while updating approval");
    }
  };

  const onSetRole = async (
    userId: string,
    role: "swimmer" | "coach" | "admin",
  ) => {
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update role");
        return;
      }

      toast.success("Role updated");
      await loadData();
    } catch {
      toast.error("Network error while updating role");
    }
  };

  const onDeletePendingUser = async (user: UserItem) => {
    const displayName =
      user.profile?.callingName || user.profile?.fullName || user.email;

    const confirmed = window.confirm(
      `Remove pending account for ${displayName}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingUserId(user._id);
    try {
      const response = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to remove user");
        return;
      }

      toast.success("Pending user removed");
      await loadData();
    } catch {
      toast.error("Network error while removing user");
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="section-heading">Admin</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-xl font-semibold text-primary-300 mb-3">
            Application Settings
          </h2>
          <Select
            className="mb-2"
            label="Team Overall Stats (for swimmers)"
            value={overallStatsVisible ? "visible" : "hidden"}
            onChange={(e) =>
              setOverallStatsVisible(e.target.value === "visible")
            }
            options={[
              { value: "visible", label: "Visible" },
              { value: "hidden", label: "Hidden" },
            ]}
          />
          <Select
            label="AI Set Generation"
            value={aiGenerationEnabled ? "enabled" : "disabled"}
            onChange={(e) =>
              setAiGenerationEnabled(e.target.value === "enabled")
            }
            options={[
              { value: "enabled", label: "Enabled" },
              { value: "disabled", label: "Disabled" },
            ]}
          />
          <div className="mt-4">
            <Button onClick={onSaveSettings} isLoading={isSaving}>
              Save Settings
            </Button>
          </div>
        </Card>

        <Card id="publish-announcement">
          <h2 className="text-xl font-semibold text-primary-300 mb-3">
            Publish Announcement
          </h2>
          <div className="space-y-3">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="input-field w-full min-h-28"
              placeholder="Announcement content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <Select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
              ]}
            />
            <Button onClick={onPublishAnnouncement} isLoading={isSaving}>
              Publish
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-primary-300 mb-3">
          Pending Leave Requests
        </h2>
        {pendingRequests.length === 0 ? (
          <p className="text-gray-400">No pending requests.</p>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((record) => (
              <div
                key={record._id}
                className="border border-primary-500/20 rounded-lg p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <p className="text-sm text-gray-200">
                    {record.userName || record.userId} ·{" "}
                    {new Date(record.date).toLocaleDateString()} · {record.type}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onApprove(record._id, true)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onApprove(record._id, false)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-300">
                  Leave type: {record.leaveType || "-"} · Reason:{" "}
                  {record.reason || "-"}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-primary-300 mb-3">Users</h2>
        {users.length === 0 ? (
          <p className="text-gray-400">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => (
                  <tr key={user._id}>
                    <td>
                      {user.profile?.callingName ||
                        user.profile?.fullName ||
                        "-"}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        className="input-field min-w-[130px]"
                        value={user.role}
                        onChange={(event) =>
                          void onSetRole(
                            user._id,
                            event.target.value as "swimmer" | "coach" | "admin",
                          )
                        }
                      >
                        <option value="swimmer">Swimmer</option>
                        <option value="coach">Coach</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      {user.isApproved ? (
                        <span className="text-green-400">Approved</span>
                      ) : (
                        <span className="text-yellow-400">Pending</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {user.isApproved ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => void onSetApproval(user._id, false)}
                          >
                            Set Pending
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => void onSetApproval(user._id, true)}
                            >
                              Approve
                            </Button>
                            <button
                              type="button"
                              onClick={() => void onDeletePendingUser(user)}
                              disabled={deletingUserId === user._id}
                              aria-label="Remove pending user"
                              title="Remove pending user"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/40 bg-red-500/15 text-red-300 transition hover:bg-red-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <X size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-primary-300 mb-3">
          Manage Announcements
        </h2>
        {announcements.length === 0 ? (
          <p className="text-gray-400">No announcements found.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => {
              const isEditing = editingAnnouncementId === announcement._id;

              return (
                <div
                  key={announcement._id}
                  className="border border-primary-500/20 rounded-lg p-3"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        label="Title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                      <textarea
                        className="input-field w-full min-h-28"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                      <Select
                        label="Priority"
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                        options={[
                          { value: "low", label: "Low" },
                          { value: "medium", label: "Medium" },
                          { value: "high", label: "High" },
                        ]}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={onSaveAnnouncementEdit}
                          isLoading={isUpdatingAnnouncement}
                        >
                          Save Changes
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={onCancelEditAnnouncement}
                          disabled={isUpdatingAnnouncement}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {announcement.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-wide text-primary-300">
                            {announcement.priority}
                          </span>
                          <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-500">
                            {announcement.editedAt ? "Edited" : "Original"}
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              onStartEditAnnouncement(announcement)
                            }
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-gray-300 whitespace-pre-wrap">
                        {announcement.content}
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
