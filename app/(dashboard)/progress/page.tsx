"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { SWIMMING_EVENTS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type Role = "swimmer" | "coach" | "admin";
type SwimmingEvent = (typeof SWIMMING_EVENTS)[number];

type Timing = {
  _id: string;
  event: string;
  time: string;
  date: string;
  type: "trial" | "meet";
  meetName?: string;
};

type OverallRow = {
  userId: string;
  name: string;
  email: string;
  totalTimings: number;
  eventsTracked: number;
};

type SwimmerDetailStats = {
  totalTimings: number;
  eventsTracked: number;
  bestByEvent: Record<string, string>;
};

export default function ProgressPage() {
  const [role, setRole] = useState<Role>("swimmer");
  const [event, setEvent] = useState<SwimmingEvent>(SWIMMING_EVENTS[0]);
  const [time, setTime] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<"trial" | "meet">("trial");
  const [meetName, setMeetName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [timings, setTimings] = useState<Timing[]>([]);
  const [stats, setStats] = useState<{
    totalTimings: number;
    eventsTracked: number;
  }>();
  const [overallRows, setOverallRows] = useState<OverallRow[]>([]);
  const [selectedSwimmer, setSelectedSwimmer] = useState<OverallRow | null>(
    null,
  );
  const [swimmerTimings, setSwimmerTimings] = useState<Timing[]>([]);
  const [swimmerStats, setSwimmerStats] = useState<SwimmerDetailStats | null>(
    null,
  );
  const [isLoadingSwimmer, setIsLoadingSwimmer] = useState(false);
  const [editingTimingId, setEditingTimingId] = useState<string | null>(null);
  const [editEvent, setEditEvent] = useState<SwimmingEvent>(SWIMMING_EVENTS[0]);
  const [editTime, setEditTime] = useState("");
  const [editDate, setEditDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [editType, setEditType] = useState<"trial" | "meet">("trial");
  const [editMeetName, setEditMeetName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingTimingId, setDeletingTimingId] = useState<string | null>(null);

  const isManager = role === "admin" || role === "coach";

  const loadData = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      const userRole = (meData?.user?.role || "swimmer") as Role;
      setRole(userRole);

      if (userRole === "swimmer") {
        const [timingsRes, statsRes] = await Promise.all([
          fetch("/api/timings"),
          fetch("/api/timings/stats"),
        ]);

        const timingsData = await timingsRes.json();
        const statsData = await statsRes.json();

        if (timingsRes.ok) {
          setTimings(timingsData.timings || []);
        }

        if (statsRes.ok) {
          setStats(statsData.stats || undefined);
        }
      } else {
        const overallRes = await fetch("/api/timings/stats/overall");
        const overallData = await overallRes.json();
        if (overallRes.ok) {
          setOverallRows(overallData?.overall?.bySwimmer || []);
        }
      }
    } catch {
      toast.error("Failed to load progress data");
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const onAddTiming = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/timings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, time, date, type, meetName, notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to add timing");
        return;
      }

      toast.success("Timing added");
      setTime("");
      setMeetName("");
      setNotes("");
      await loadData();
    } catch {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onOpenSwimmer = async (row: OverallRow) => {
    setSelectedSwimmer(row);
    setIsLoadingSwimmer(true);

    try {
      const [timingsRes, statsRes] = await Promise.all([
        fetch(`/api/timings?userId=${row.userId}`),
        fetch(`/api/timings/stats?userId=${row.userId}`),
      ]);

      const timingsData = await timingsRes.json();
      const statsData = await statsRes.json();

      if (timingsRes.ok) {
        setSwimmerTimings(timingsData.timings || []);
      } else {
        setSwimmerTimings([]);
      }

      if (statsRes.ok && statsData?.stats) {
        setSwimmerStats(statsData.stats as SwimmerDetailStats);
      } else {
        setSwimmerStats(null);
      }
    } catch {
      toast.error("Failed to load swimmer details");
      setSwimmerTimings([]);
      setSwimmerStats(null);
    } finally {
      setIsLoadingSwimmer(false);
    }
  };

  const startEditTiming = (timing: Timing) => {
    setEditingTimingId(timing._id);
    setEditEvent(timing.event as SwimmingEvent);
    setEditTime(timing.time);
    setEditDate(new Date(timing.date).toISOString().slice(0, 10));
    setEditType(timing.type);
    setEditMeetName(timing.meetName || "");
    setEditNotes("");
  };

  const cancelEditTiming = () => {
    setEditingTimingId(null);
    setIsSavingEdit(false);
  };

  const onSaveEditTiming = async () => {
    if (!editingTimingId) return;

    setIsSavingEdit(true);
    try {
      const response = await fetch("/api/timings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timingId: editingTimingId,
          event: editEvent,
          time: editTime,
          date: editDate,
          type: editType,
          meetName: editMeetName,
          notes: editNotes,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update timing");
        return;
      }

      toast.success("Timing updated");
      setEditingTimingId(null);
      await loadData();
    } catch {
      toast.error("Network error while updating timing");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const onDeleteTiming = async (timingId: string) => {
    setDeletingTimingId(timingId);
    try {
      const response = await fetch("/api/timings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timingId }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to delete timing");
        return;
      }

      toast.success("Timing deleted");
      if (editingTimingId === timingId) {
        setEditingTimingId(null);
      }
      await loadData();
    } catch {
      toast.error("Network error while deleting timing");
    } finally {
      setDeletingTimingId(null);
    }
  };

  if (isManager) {
    return (
      <div className="space-y-6">
        <h1 className="section-heading">Team Progress</h1>
        <Card>
          <h2 className="text-xl font-semibold text-primary-300 mb-4">
            Swimmer Timing Overview
          </h2>
          {overallRows.length === 0 ? (
            <p className="text-gray-400">No timing records found.</p>
          ) : (
            <div className="max-h-[48vh] overflow-auto rounded border border-primary-500/20">
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
                    <tr
                      key={row.userId}
                      className="cursor-pointer"
                      onClick={() => void onOpenSwimmer(row)}
                    >
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

        <Card>
          <h2 className="text-xl font-semibold text-primary-300 mb-4">
            Swimmer Timing Details
          </h2>

          {!selectedSwimmer ? (
            <p className="text-gray-400">
              Click a swimmer row above to view detailed timings and event
              bests.
            </p>
          ) : isLoadingSwimmer ? (
            <p className="text-gray-400">Loading swimmer details...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="text-gray-100 font-semibold">
                    {selectedSwimmer.name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {selectedSwimmer.email}
                  </p>
                </div>
                <div className="text-sm text-gray-300">
                  <p>Total Timings: {swimmerStats?.totalTimings || 0}</p>
                  <p>Events Tracked: {swimmerStats?.eventsTracked || 0}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-primary-300 mb-2">Best By Event</p>
                {!swimmerStats?.bestByEvent ||
                Object.keys(swimmerStats.bestByEvent).length === 0 ? (
                  <p className="text-gray-400 text-sm">
                    No best times available.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {Object.entries(swimmerStats.bestByEvent).map(
                      ([eventName, best]) => (
                        <div
                          key={eventName}
                          className="border border-primary-500/20 rounded p-2 flex justify-between gap-2"
                        >
                          <span className="text-gray-300 capitalize">
                            {eventName}
                          </span>
                          <span className="text-primary-300">{best}</span>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-primary-300 mb-2">Recent Timings</p>
                {swimmerTimings.length === 0 ? (
                  <p className="text-gray-400 text-sm">No timings found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Event</th>
                          <th>Time</th>
                          <th>Type</th>
                          <th>Meet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {swimmerTimings.slice(0, 20).map((timing) => (
                          <tr key={timing._id}>
                            <td>{formatDate(timing.date)}</td>
                            <td className="capitalize">{timing.event}</td>
                            <td>{timing.time}</td>
                            <td className="capitalize">{timing.type}</td>
                            <td>{timing.meetName || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="section-heading">Progress</h1>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <h2 className="text-xl font-semibold text-primary-300 mb-4">
            Add Timing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Event"
              value={event}
              onChange={(e) => setEvent(e.target.value as SwimmingEvent)}
              options={SWIMMING_EVENTS.map((value) => ({
                value,
                label: value,
              }))}
            />
            <Input
              label="Time (MM:SS.MS or SS.MS)"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="1:12.34"
            />
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as "trial" | "meet")}
              options={[
                { value: "trial", label: "Trial" },
                { value: "meet", label: "Meet" },
              ]}
            />
            <Input
              label="Meet Name"
              value={meetName}
              onChange={(e) => setMeetName(e.target.value)}
            />
            <Input
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="mt-4">
            <Button onClick={onAddTiming} isLoading={isSubmitting}>
              Save Timing
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-primary-300 mb-4">Stats</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Timings</span>
              <span className="text-white">{stats?.totalTimings || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Events Tracked</span>
              <span className="text-white">{stats?.eventsTracked || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-primary-300 mb-4">
          Recent Timings
        </h2>
        <p className="text-sm text-slate-600 dark:text-gray-400 mb-3">
          You can edit or delete your personal timing entries here.
        </p>
        {timings.length === 0 ? (
          <p className="text-gray-400">No timings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Event</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Meet</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {timings.map((timing) => (
                  <tr key={timing._id}>
                    {editingTimingId === timing._id ? (
                      <>
                        <td>
                          <Input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                          />
                        </td>
                        <td>
                          <Select
                            value={editEvent}
                            onChange={(e) =>
                              setEditEvent(e.target.value as SwimmingEvent)
                            }
                            options={SWIMMING_EVENTS.map((value) => ({
                              value,
                              label: value,
                            }))}
                          />
                        </td>
                        <td>
                          <Input
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                          />
                        </td>
                        <td>
                          <Select
                            value={editType}
                            onChange={(e) =>
                              setEditType(e.target.value as "trial" | "meet")
                            }
                            options={[
                              { value: "trial", label: "Trial" },
                              { value: "meet", label: "Meet" },
                            ]}
                          />
                        </td>
                        <td>
                          <Input
                            value={editMeetName}
                            onChange={(e) => setEditMeetName(e.target.value)}
                          />
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={onSaveEditTiming}
                              isLoading={isSavingEdit}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={cancelEditTiming}
                            >
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{formatDate(timing.date)}</td>
                        <td className="capitalize">{timing.event}</td>
                        <td>{timing.time}</td>
                        <td className="capitalize">{timing.type}</td>
                        <td>{timing.meetName || "-"}</td>
                        <td>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => startEditTiming(timing)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => void onDeleteTiming(timing._id)}
                              isLoading={deletingTimingId === timing._id}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
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
