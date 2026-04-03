"use client";

import { useEffect, useState } from "react";
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

export default function AdminPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [overallStatsVisible, setOverallStatsVisible] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("medium");
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    try {
      const [usersRes, attendanceRes, settingsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/attendance"),
        fetch("/api/settings"),
      ]);

      const usersData = await usersRes.json();
      const attendanceData = await attendanceRes.json();
      const settingsData = await settingsRes.json();

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
        body: JSON.stringify({ overallStatsVisible }),
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
    } catch {
      toast.error("Network error while publishing");
    } finally {
      setIsSaving(false);
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

  return (
    <div className="space-y-6">
      <h1 className="section-heading">Admin</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-xl font-semibold text-primary-300 mb-3">
            Application Settings
          </h2>
          <Select
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
          <div className="mt-4">
            <Button onClick={onSaveSettings} isLoading={isSaving}>
              Save Settings
            </Button>
          </div>
        </Card>

        <Card>
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
                {users.map((user) => (
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
                          <Button
                            size="sm"
                            onClick={() => void onSetApproval(user._id, true)}
                          >
                            Approve
                          </Button>
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
    </div>
  );
}
