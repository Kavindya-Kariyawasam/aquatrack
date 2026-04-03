"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

type Role = "swimmer" | "coach" | "admin";

type Announcement = {
  _id: string;
  title: string;
  content: string;
  priority: "low" | "medium" | "high";
  status?: "active" | "cancelled" | "completed";
  createdAt: string;
  postedByName: string;
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [role, setRole] = useState<Role>("swimmer");

  const loadData = async () => {
    try {
      const [meRes, annRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/announcements"),
      ]);

      const meData = await meRes.json();
      const annData = await annRes.json();

      if (meRes.ok) {
        setRole((meData?.user?.role || "swimmer") as Role);
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

  return (
    <div className="space-y-6">
      <h1 className="section-heading">Announcements</h1>
      {announcements.length === 0 ? (
        <Card>
          <p className="text-gray-400">No announcements yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <Card key={announcement._id}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {announcement.title}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-primary-300">
                    {announcement.priority}
                  </span>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
