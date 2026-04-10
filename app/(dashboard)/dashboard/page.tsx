"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

type Role = "swimmer" | "coach" | "admin";

type MeResponse = {
  success: boolean;
  user?: {
    email: string;
    role: Role;
    name: string;
  };
};

export default function DashboardPage() {
  const [name, setName] = useState("Swimmer");
  const [role, setRole] = useState<Role>("swimmer");
  const [stats, setStats] = useState({
    totalTimings: 0,
    eventsTracked: 0,
    attendanceCount: 0,
    trainingCount: 0,
    pendingLeaveCount: 0,
    usersCount: 0,
    announcementsCount: 0,
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState<
    {
      _id: string;
      title: string;
      createdAt: string;
      priority: string;
      editedAt?: string;
    }[]
  >([]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = (await response.json()) as MeResponse;
        if (response.ok && data.user) {
          setName(data.user.name || "Swimmer");
          setRole(data.user.role || "swimmer");
        }
      } catch {
        // no-op
      }
    };

    const loadStats = async () => {
      try {
        const [
          timingsRes,
          attendanceRes,
          trainingRes,
          announcementsRes,
          usersRes,
        ] = await Promise.all([
          fetch("/api/timings/stats"),
          fetch("/api/attendance"),
          fetch("/api/training-sets?limit=1"),
          fetch("/api/announcements?status=active&limit=3"),
          fetch("/api/users"),
        ]);

        const timingsData = await timingsRes.json();
        const attendanceData = await attendanceRes.json();
        const trainingData = await trainingRes.json();
        const announcementsData = await announcementsRes.json();
        const usersData = usersRes.ok ? await usersRes.json() : {};
        const attendanceRecords = attendanceData?.records || [];

        setStats({
          totalTimings: timingsData?.stats?.totalTimings || 0,
          eventsTracked: timingsData?.stats?.eventsTracked || 0,
          attendanceCount: attendanceRecords.length || 0,
          trainingCount: trainingData?.sets?.length || 0,
          pendingLeaveCount: attendanceRecords.filter(
            (record: { status?: string }) =>
              record.status === "absent-requested",
          ).length,
          usersCount: usersData?.users?.length || 0,
          announcementsCount: announcementsData?.announcements?.length || 0,
        });

        setRecentAnnouncements(announcementsData?.announcements || []);
      } catch {
        // no-op
      }
    };

    void loadUser();
    void loadStats();
  }, []);

  const isManager = role === "admin" || role === "coach";

  const statCards = isManager
    ? [
        { label: "Pending Leave Requests", value: stats.pendingLeaveCount },
        { label: "Team Members", value: stats.usersCount },
        { label: "Announcements", value: stats.announcementsCount },
      ]
    : [
        { label: "Timings Added", value: stats.totalTimings },
        { label: "Events Tracked", value: stats.eventsTracked },
        { label: "Attendance Records", value: stats.attendanceCount },
      ];

  const quickActions =
    role === "admin"
      ? [
          { href: "/admin", label: "Review Approvals" },
          { href: "/attendance", label: "Manage Attendance" },
          { href: "/stats", label: "View Team Stats" },
          { href: "/admin#publish-announcement", label: "Post Announcement" },
          { href: "/team", label: "View Team" },
          { href: "/training", label: "Manage Sets" },
        ]
      : role === "coach"
        ? [
            { href: "/attendance", label: "Manage Attendance" },
            { href: "/stats", label: "View Team Stats" },
            { href: "/announcements", label: "Post Announcement" },
            { href: "/team", label: "View Team" },
            { href: "/training", label: "Manage Sets" },
            { href: "/progress", label: "Review Timings" },
          ]
        : [
            { href: "/progress", label: "Add Timing" },
            { href: "/training", label: "View Sets" },
            { href: "/attendance", label: "Request Leave" },
            { href: "/profile", label: "Update Profile" },
          ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="section-heading">Dashboard</h1>
        <p className="text-gray-400">
          Welcome back,{" "}
          <span className="text-primary-300 font-medium">{name}</span> ({role})
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((item) => (
          <Card key={item.label}>
            <div className="stat-value">{item.value}</div>
            <div className="stat-label">{item.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-xl font-semibold mb-3 text-primary-300">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {quickActions.map((action) => (
              <Link
                key={action.href + action.label}
                href={action.href}
                className="glass-card-hover p-3 text-center"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-3 text-primary-300">
            Latest Announcements
          </h2>
          {recentAnnouncements.length === 0 ? (
            <p className="text-gray-400">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map((announcement) => (
                <Link
                  key={announcement._id}
                  href="/announcements"
                  className="block border border-primary-500/20 rounded-lg p-3 hover:bg-primary-500/5 transition-colors duration-150"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <span className="min-w-0 font-medium text-slate-900 dark:text-white hover:text-primary-300 break-words">
                      {announcement.title}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {announcement.editedAt && (
                        <span className="text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wide">
                          Edited
                        </span>
                      )}
                      <span className="text-xs text-primary-300 capitalize">
                        {announcement.priority}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(announcement.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
