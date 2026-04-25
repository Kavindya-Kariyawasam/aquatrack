"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { getAuthMeUser } from "@/lib/authMeClient";
import { formatDate } from "@/lib/utils";

type Role = "swimmer" | "coach" | "admin";

type Announcement = {
  _id: string;
  title: string;
  content: string;
  priority: "low" | "medium" | "high";
  status?: "active" | "cancelled" | "completed";
  editedAt?: string;
  createdAt: string;
  postedByName: string;
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [role, setRole] = useState<Role>("swimmer");
  const [editingAnnouncementId, setEditingAnnouncementId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">(
    "medium",
  );
  const [isUpdatingAnnouncement, setIsUpdatingAnnouncement] = useState(false);

  const loadData = async () => {
    try {
      const [user, annRes] = await Promise.all([
        getAuthMeUser(),
        fetch("/api/announcements"),
      ]);
      const annData = await annRes.json();

      if (user?.role) {
        setRole(user.role as Role);
      }

      if (annRes.ok) {
        setAnnouncements(annData?.announcements || []);
      }
    } catch {
      toast.error("Failed to load announcements");
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const canManage = role === "admin" || role === "coach";

  const onSetStatus = async (
    announcementId: string,
    status: "active" | "cancelled" | "completed",
  ) => {
    try {
      const response = await fetch("/api/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId, status }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update announcement");
        return;
      }

      toast.success(
        status === "cancelled"
          ? "Announcement cancelled"
          : status === "completed"
            ? "Announcement marked completed"
            : "Announcement re-activated",
      );
      await loadData();
    } catch {
      toast.error("Network error while updating announcement");
    }
  };

  const onStartEditAnnouncement = (announcement: Announcement) => {
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

  return (
    <div className="space-y-6">
      <h1 className="section-heading">Announcements</h1>
      {announcements.length === 0 ? (
        <Card>
          <p className="text-gray-400">No announcements yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => {
            const isEditing = editingAnnouncementId === announcement._id;

            return (
              <Card key={announcement._id}>
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      label="Title"
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                    />

                    <textarea
                      className="input-field w-full min-h-28"
                      value={editContent}
                      onChange={(event) => setEditContent(event.target.value)}
                    />

                    <div className="space-y-1">
                      <label className="block text-sm text-slate-700 dark:text-gray-300">
                        Priority
                      </label>
                      <select
                        className="input-field w-full"
                        value={editPriority}
                        onChange={(event) =>
                          setEditPriority(
                            event.target.value as "low" | "medium" | "high",
                          )
                        }
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => void onSaveAnnouncementEdit()}
                        isLoading={isUpdatingAnnouncement}
                      >
                        Save Changes
                      </Button>
                      <Button
                        size="sm"
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
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {announcement.title}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wide text-primary-300">
                          {announcement.priority}
                        </span>
                        {announcement.editedAt && (
                          <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-500">
                            Edited
                          </span>
                        )}
                        <span
                          className={`text-xs uppercase tracking-wide ${
                            announcement.status === "cancelled"
                              ? "text-red-400"
                              : announcement.status === "completed"
                                ? "text-blue-400"
                                : "text-green-400"
                          }`}
                        >
                          {announcement.status || "active"}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-700 dark:text-gray-300 whitespace-pre-wrap">
                      {announcement.content}
                    </p>

                    <p className="text-xs text-slate-500 dark:text-gray-500 mt-3">
                      {announcement.postedByName} ·{" "}
                      {formatDate(announcement.createdAt)}
                    </p>

                    {canManage && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onStartEditAnnouncement(announcement)}
                        >
                          Edit
                        </Button>
                        {announcement.status !== "active" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              void onSetStatus(announcement._id, "active")
                            }
                          >
                            Mark Active
                          </Button>
                        )}
                        {announcement.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              void onSetStatus(announcement._id, "completed")
                            }
                          >
                            Mark Completed
                          </Button>
                        )}
                        {announcement.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              void onSetStatus(announcement._id, "cancelled")
                            }
                          >
                            Mark Cancelled
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
