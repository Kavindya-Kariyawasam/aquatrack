"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { getAuthMeUser } from "@/lib/authMeClient";

type Role = "swimmer" | "coach" | "admin";

type Stats = {
  totalTimings: number;
  eventsTracked: number;
  bestByEvent: Record<string, string>;
};

type OverallRow = {
  userId: string;
  name: string;
  email: string;
  totalTimings: number;
  eventsTracked: number;
  gender?: string;
};

type LeaderboardItem = {
  userId: string;
  name: string;
  gender?: string;
  time: string;
};

type GenderLeaderboard = {
  men: LeaderboardItem[];
  women: LeaderboardItem[];
};

export default function StatsPage() {
  const [role, setRole] = useState<Role>("swimmer");
  const [isRoleLoaded, setIsRoleLoaded] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [overallRows, setOverallRows] = useState<OverallRow[]>([]);
  const [leaderboardByEvent, setLeaderboardByEvent] = useState<
    Record<string, LeaderboardItem[]>
  >({});
  const [leaderboardByEventGender, setLeaderboardByEventGender] = useState<
    Record<string, GenderLeaderboard>
  >({});
  const [swimmerSelectedEvents, setSwimmerSelectedEvents] = useState<string[]>(
    [],
  );
  const [swimmerGender, setSwimmerGender] = useState("");
  const [overallEnabled, setOverallEnabled] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [user, statsRes] = await Promise.all([
        getAuthMeUser(),
        fetch("/api/timings/stats"),
      ]);
      const statsData = await statsRes.json();

      const currentRole = (user?.role || "swimmer") as Role;
      setRole(currentRole);
      setSwimmerGender(String(user?.gender || "").toLowerCase());
      const selectedEvents = Array.from(
        new Set([...(user?.mainEvents || []), ...(user?.extraEvents || [])]),
      ).slice(0, 5);
      setSwimmerSelectedEvents(selectedEvents);

      if (statsRes.ok) {
        setStats(statsData.stats || null);
      }

      const overallRes = await fetch("/api/timings/stats/overall");
      const overallData = await overallRes.json();

      if (overallRes.ok) {
        setOverallRows(overallData?.overall?.bySwimmer || []);
        setLeaderboardByEvent(overallData?.overall?.leaderboardByEvent || {});
        setLeaderboardByEventGender(
          overallData?.overall?.leaderboardByEventGender || {},
        );
      } else {
        setOverallRows([]);
        setLeaderboardByEvent({});
        setLeaderboardByEventGender({});
      }

      setOverallEnabled(
        overallRes.ok || currentRole === "admin" || currentRole === "coach",
      );

      setIsRoleLoaded(true);
    };

    void load();
  }, []);

  const isManager = role === "admin" || role === "coach";
  const fallbackSpotlightEvents = Object.keys(leaderboardByEventGender).slice(
    0,
    5,
  );
  const spotlightEvents =
    swimmerSelectedEvents.length > 0
      ? swimmerSelectedEvents
      : fallbackSpotlightEvents;

  if (!isRoleLoaded) {
    return (
      <div className="space-y-6">
        <h1 className="section-heading">Stats</h1>
        <Card>
          <p className="text-gray-400">Loading stats workspace...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="section-heading">Stats</h1>

      {!isManager && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h2 className="text-xl font-semibold text-primary-300 mb-3">
              Personal Overview
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Timings</span>
                <span>{stats?.totalTimings || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Events Tracked</span>
                <span>{stats?.eventsTracked || 0}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-primary-300 mb-3">
              Personal Bests
            </h2>
            {stats?.bestByEvent && Object.keys(stats.bestByEvent).length > 0 ? (
              <div className="space-y-2 text-sm max-h-72 overflow-auto pr-2">
                {Object.entries(stats.bestByEvent).map(([event, best]) => (
                  <div
                    key={event}
                    className="flex justify-between gap-3 border-b border-primary-500/20 pb-2"
                  >
                    <span className="text-slate-700 dark:text-gray-300 capitalize">
                      {event}
                    </span>
                    <span className="text-primary-300 font-medium">{best}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No best times yet.</p>
            )}
          </Card>
        </div>
      )}

      {!isManager && !overallEnabled && (
        <Card>
          <h2 className="text-xl font-semibold text-primary-300 mb-2">
            Team Event Spotlight
          </h2>
          <p className="text-sm text-gray-400">
            Hidden by admin settings right now. Ask an admin to enable
            &quot;Team Overall Stats (for swimmers)&quot; in Admin settings.
          </p>
        </Card>
      )}

      {!isManager && overallEnabled && (
        <Card>
          <h2 className="text-xl font-semibold text-primary-300 mb-3">
            Team Event Spotlight (Top 3)
          </h2>
          <p className="text-sm text-slate-600 dark:text-gray-400 mb-3">
            Shows top 3 swimmers for your selected events, filtered by your
            gender category.
          </p>
          {spotlightEvents.length === 0 ? (
            <p className="text-gray-400">No team event data available yet.</p>
          ) : (
            <div className="space-y-3">
              {swimmerSelectedEvents.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Your profile events are not set yet, so showing latest team
                  event leaderboards.
                </p>
              )}
              {spotlightEvents.map((eventName) => {
                const genderData = leaderboardByEventGender[eventName];
                const rows =
                  swimmerGender === "female"
                    ? genderData?.women || []
                    : swimmerGender === "male"
                      ? genderData?.men || []
                      : leaderboardByEvent[eventName] || [];

                return (
                  <div
                    key={`spotlight-${eventName}`}
                    className="border border-primary-500/20 rounded-lg p-3"
                  >
                    <h3 className="font-semibold text-slate-800 dark:text-gray-100 mb-2 capitalize">
                      {eventName}
                    </h3>
                    {rows.length === 0 ? (
                      <p className="text-gray-500 text-sm">No entries yet.</p>
                    ) : (
                      <div className="space-y-1 text-sm">
                        {rows.map((row, index) => (
                          <div
                            key={`spotlight-${eventName}-${row.userId}-${index}`}
                            className="flex justify-between gap-2"
                          >
                            <span className="text-slate-700 dark:text-gray-300">
                              {index + 1}. {row.name}
                            </span>
                            <span className="text-primary-300">{row.time}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {isManager && (
        <Card>
          <h2 className="text-xl font-semibold text-primary-300 mb-3">
            Team Event Leaderboard (Top 3)
          </h2>
          {Object.keys(leaderboardByEvent).length === 0 ? (
            <p className="text-gray-400">No team leaderboard data available.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(leaderboardByEvent).map(([eventName, rows]) => (
                <div
                  key={eventName}
                  className="border border-primary-500/20 rounded-lg p-3"
                >
                  <h3 className="font-semibold text-slate-800 dark:text-gray-100 mb-2 capitalize">
                    {eventName}
                  </h3>
                  {(() => {
                    const genderRows = leaderboardByEventGender[eventName] || {
                      men: rows.filter((row) =>
                        ["male", "m", "men"].includes(
                          String(row.gender || "")
                            .trim()
                            .toLowerCase(),
                        ),
                      ),
                      women: rows.filter((row) =>
                        ["female", "f", "women"].includes(
                          String(row.gender || "")
                            .trim()
                            .toLowerCase(),
                        ),
                      ),
                    };

                    return (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-10">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-primary-300 mb-1">
                            Men
                          </p>
                          <div className="space-y-1 text-sm">
                            {genderRows.men.map((row, index) => (
                              <div
                                key={`${eventName}-men-${row.userId}-${index}`}
                                className="flex justify-between gap-2"
                              >
                                <span className="text-slate-700 dark:text-gray-300">
                                  {index + 1}. {row.name}
                                </span>
                                <span className="text-primary-300">
                                  {row.time}
                                </span>
                              </div>
                            ))}
                            {genderRows.men.length === 0 && (
                              <p className="text-gray-500">No entries</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-primary-300 mb-1">
                            Women
                          </p>
                          <div className="space-y-1 text-sm">
                            {genderRows.women.map((row, index) => (
                              <div
                                key={`${eventName}-women-${row.userId}-${index}`}
                                className="flex justify-between gap-2"
                              >
                                <span className="text-slate-700 dark:text-gray-300">
                                  {index + 1}. {row.name}
                                </span>
                                <span className="text-primary-300">
                                  {row.time}
                                </span>
                              </div>
                            ))}
                            {genderRows.women.length === 0 && (
                              <p className="text-gray-500">No entries</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {isManager && (
        <Card>
          <h2 className="text-xl font-semibold text-primary-300 mb-3">
            Team Overall Stats
          </h2>
          {overallRows.length === 0 ? (
            <p className="text-gray-400">No team stats available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Swimmer</th>
                    <th>Email</th>
                    <th>Total Timings</th>
                    <th>Events Tracked</th>
                  </tr>
                </thead>
                <tbody>
                  {overallRows.map((row) => (
                    <tr key={row.userId}>
                      <td>{row.name}</td>
                      <td>{row.email}</td>
                      <td>{row.totalTimings}</td>
                      <td>{row.eventsTracked}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {role !== "swimmer" && (
        <Card>
          <p className="text-gray-400 text-sm">
            As a {role}, your operational dashboards are Attendance, Training,
            and Admin for team management.
          </p>
        </Card>
      )}
    </div>
  );
}
