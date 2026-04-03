"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { LEAVE_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type Role = "swimmer" | "coach" | "admin";

type AttendanceRecord = {
  _id: string;
  userId: string;
  userName?: string;
  date: string;
  type: "swimming" | "land";
  status:
    | "present"
    | "absent-requested"
    | "absent-approved"
    | "absent-unrequested";
  leaveType?: string;
  reason?: string;
};

type AttendanceSummaryRow = {
  userId: string;
  userName: string;
  approved: number;
  pending: number;
  rejected: number;
  byLeaveType: Record<string, number>;
};

type SettingsResponse = {
  settings?: {
    weeklySchedule?: Record<string, "swimming" | "land" | "none">;
    holidays?: Array<{
      date: string;
      reason?: string;
      sessionType: "swimming" | "land" | "none";
    }>;
  };
};

type SwimmerOption = {
  _id: string;
  name: string;
};

type DaySummary = {
  present: number;
  approved: number;
  absent: number;
};

type SwimmerMonthSummary = {
  byLeaveType: Record<string, number>;
};

const STATUS_STYLES: Record<string, string> = {
  "absent-requested": "text-yellow-300",
  "absent-approved": "text-green-400",
  "absent-unrequested": "text-red-400",
  present: "text-blue-300",
};

const STATUS_LABELS: Record<string, string> = {
  present: "Present",
  "absent-approved": "Approved Leave",
  "absent-requested": "Absent (Pending/Rejected Leave)",
  "absent-unrequested": "Absent",
};

const STATUS_SHORT_LABELS: Record<string, string> = {
  present: "P",
  "absent-approved": "AL",
  "absent-requested": "ABS",
  "absent-unrequested": "ABS",
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  "absent-requested": "bg-red-500/15 text-red-300 border-red-500/30",
  "absent-approved": "bg-green-500/15 text-green-300 border-green-500/30",
  "absent-unrequested": "bg-red-500/15 text-red-300 border-red-500/30",
  present: "bg-blue-500/15 text-blue-300 border-blue-500/30",
};

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const WEEKDAY_LOOKUP = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function toIsoDate(dateLike: Date | string) {
  return new Date(dateLike).toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const [role, setRole] = useState<Role>("swimmer");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<"swimming" | "land">("swimming");
  const [leaveType, setLeaveType] = useState<keyof typeof LEAVE_TYPES>("exam");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const [monthFilter, setMonthFilter] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [summaryRows, setSummaryRows] = useState<AttendanceSummaryRow[]>([]);
  const [swimmerMonthSummary, setSwimmerMonthSummary] =
    useState<SwimmerMonthSummary | null>(null);
  const [calendarRecords, setCalendarRecords] = useState<AttendanceRecord[]>(
    [],
  );
  const [managerDate, setManagerDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [managerType, setManagerType] = useState<"swimming" | "land">(
    "swimming",
  );
  const [swimmers, setSwimmers] = useState<SwimmerOption[]>([]);
  const [isMarking, setIsMarking] = useState(false);
  const [overrideNoPractice, setOverrideNoPractice] = useState(false);

  const [weeklySchedule, setWeeklySchedule] = useState<
    Record<string, "swimming" | "land" | "none">
  >({
    monday: "swimming",
    tuesday: "swimming",
    wednesday: "none",
    thursday: "none",
    friday: "swimming",
    saturday: "land",
    sunday: "none",
  });
  const [holidays, setHolidays] = useState<
    Array<{
      date: string;
      reason?: string;
      sessionType: "swimming" | "land" | "none";
    }>
  >([]);
  const [holidayDate, setHolidayDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [holidayReason, setHolidayReason] = useState("");
  const [holidayType, setHolidayType] = useState<"swimming" | "land" | "none">(
    "none",
  );
  const [showAllHolidays, setShowAllHolidays] = useState(false);

  const isManager = role === "admin" || role === "coach";

  const loadCore = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meRes.ok && meData.user?.role) {
        setRole(meData.user.role as Role);
      }
    } catch {
      toast.error("Failed to load user role");
    }
  };

  const loadSwimmerRecords = useCallback(async () => {
    try {
      const response = await fetch("/api/attendance/request");
      const data = await response.json();
      if (response.ok) {
        setRecords(data.records || []);
      }
    } catch {
      toast.error("Failed to load leave history");
    }
  }, []);

  const loadManagerRecords = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (monthFilter) params.set("month", monthFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/attendance?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        setRecords(data.records || []);
      }
    } catch {
      toast.error("Failed to load attendance records");
    }
  }, [monthFilter, statusFilter]);

  const loadSummary = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/attendance/summary?month=${monthFilter}`,
      );
      const data = await response.json();
      if (response.ok && Array.isArray(data.summary)) {
        setSummaryRows(data.summary);
      }
    } catch {
      toast.error("Failed to load attendance summary");
    }
  }, [monthFilter]);

  const loadSwimmerSummary = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/attendance/summary?month=${monthFilter}`,
      );
      const data = await response.json();
      if (response.ok && data.summary && !Array.isArray(data.summary)) {
        setSwimmerMonthSummary(data.summary as SwimmerMonthSummary);
      }
    } catch {
      toast.error("Failed to load monthly leave summary");
    }
  }, [monthFilter]);

  const loadCalendarRecords = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (monthFilter) params.set("month", monthFilter);

      const response = await fetch(`/api/attendance?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        setCalendarRecords(data.records || []);
      }
    } catch {
      toast.error("Failed to load monthly calendar records");
    }
  }, [monthFilter]);

  const loadSwimmers = useCallback(async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.users)) {
        return;
      }

      const nextSwimmers: SwimmerOption[] = data.users
        .filter((user: { role?: string; isApproved?: boolean }) => {
          return user.role === "swimmer" && user.isApproved !== false;
        })
        .map(
          (user: {
            _id: string;
            email?: string;
            profile?: { callingName?: string; fullName?: string };
          }) => ({
            _id: user._id,
            name:
              user.profile?.callingName ||
              user.profile?.fullName ||
              user.email ||
              user._id,
          }),
        )
        .sort((a: SwimmerOption, b: SwimmerOption) =>
          a.name.localeCompare(b.name),
        );

      setSwimmers(nextSwimmers);
    } catch {
      toast.error("Failed to load swimmers list");
    }
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      const data = (await response.json()) as SettingsResponse;
      if (!response.ok || !data.settings) return;

      if (data.settings.weeklySchedule) {
        setWeeklySchedule((prev) => ({
          ...prev,
          ...data.settings?.weeklySchedule,
        }));
      }

      if (Array.isArray(data.settings.holidays)) {
        setHolidays(
          data.settings.holidays
            .map((holiday) => ({
              date: new Date(holiday.date).toISOString().slice(0, 10),
              reason: holiday.reason || "",
              sessionType: holiday.sessionType,
            }))
            .sort((a, b) => b.date.localeCompare(a.date)),
        );
      }
    } catch {
      toast.error("Failed to load attendance settings");
    }
  };

  useEffect(() => {
    void loadCore();
  }, []);

  useEffect(() => {
    if (isManager) {
      void Promise.all([
        loadManagerRecords(),
        loadCalendarRecords(),
        loadSummary(),
        loadSettings(),
        loadSwimmers(),
      ]);
    } else {
      void Promise.all([
        loadSwimmerRecords(),
        loadSwimmerSummary(),
        loadCalendarRecords(),
        loadSettings(),
      ]);
    }
  }, [
    isManager,
    loadCalendarRecords,
    loadManagerRecords,
    loadSummary,
    loadSwimmerSummary,
    loadSwimmerRecords,
    loadSwimmers,
  ]);

  useEffect(() => {
    if (!isManager) return;
    if (!managerDate.startsWith(monthFilter)) {
      setManagerDate(`${monthFilter}-01`);
    }
  }, [isManager, managerDate, monthFilter]);

  const onRequestLeave = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/attendance/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, type, leaveType, reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to submit request");
        return;
      }

      toast.success("Leave request submitted");
      setReason("");
      await loadSwimmerRecords();
    } catch {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
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
        toast.error(data.error || "Failed to update request");
        return;
      }

      toast.success(approve ? "Request approved" : "Request rejected");
      await Promise.all([loadManagerRecords(), loadSummary()]);
    } catch {
      toast.error("Network error while updating request");
    }
  };

  const saveAttendanceSettings = async (
    nextSchedule = weeklySchedule,
    nextHolidays = holidays,
  ) => {
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weeklySchedule: nextSchedule,
          holidays: nextHolidays,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to save attendance settings");
        return false;
      }

      toast.success("Attendance settings saved");
      return true;
    } catch {
      toast.error("Network error while saving settings");
      return false;
    }
  };

  const addHoliday = async () => {
    if (!holidayDate) {
      toast.error("Holiday date is required");
      return;
    }

    const nextHolidays = [
      ...holidays.filter((holiday) => holiday.date !== holidayDate),
      {
        date: holidayDate,
        reason: holidayReason.trim(),
        sessionType: holidayType,
      },
    ].sort((a, b) => b.date.localeCompare(a.date));

    const saved = await saveAttendanceSettings(weeklySchedule, nextHolidays);
    if (saved) {
      setHolidays(nextHolidays);
      setHolidayReason("");
    }
  };

  const removeHoliday = async (dateText: string) => {
    const nextHolidays = holidays.filter(
      (holiday) => holiday.date !== dateText,
    );
    const saved = await saveAttendanceSettings(weeklySchedule, nextHolidays);
    if (saved) {
      setHolidays(nextHolidays);
    }
  };

  const saveSchedule = async () => {
    await saveAttendanceSettings();
  };

  const monthGrid = useMemo(() => {
    if (!/^\d{4}-\d{2}$/.test(monthFilter)) return [] as Array<string | null>;

    const [yearText, monthText] = monthFilter.split("-");
    const year = Number(yearText);
    const monthIndex = Number(monthText) - 1;

    const firstOfMonth = new Date(year, monthIndex, 1);
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const cells: Array<string | null> = Array.from({ length: firstWeekday })
      .fill(null)
      .map(() => null);

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(`${monthFilter}-${String(day).padStart(2, "0")}`);
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [monthFilter]);

  const daySummaries = useMemo(() => {
    const summary = new Map<string, DaySummary>();

    for (const record of calendarRecords) {
      const dayKey = toIsoDate(record.date);
      const existing = summary.get(dayKey) || {
        present: 0,
        approved: 0,
        absent: 0,
      };

      if (record.status === "present") existing.present += 1;
      if (record.status === "absent-approved") existing.approved += 1;
      if (record.status === "absent-unrequested") existing.absent += 1;

      summary.set(dayKey, existing);
    }

    return summary;
  }, [calendarRecords]);

  const selectedDateRecords = useMemo(() => {
    return calendarRecords
      .filter(
        (record) =>
          toIsoDate(record.date) === managerDate && record.type === managerType,
      )
      .sort((a, b) => a.userName?.localeCompare(b.userName || "") || 0);
  }, [calendarRecords, managerDate, managerType]);

  const selectedStatusByUser = useMemo(() => {
    const map = new Map<string, AttendanceRecord["status"]>();
    for (const record of selectedDateRecords) {
      map.set(record.userId, record.status);
    }
    return map;
  }, [selectedDateRecords]);

  const selectedPracticeMeta = useMemo(() => {
    const day = new Date(`${managerDate}T00:00:00`);
    const weekdayKey = WEEKDAY_LOOKUP[day.getDay()];
    const plannedSession = weeklySchedule[weekdayKey];
    const isScheduled = plannedSession === managerType;

    const holiday = holidays.find((item) => {
      return (
        item.date === managerDate &&
        (item.sessionType === "none" || item.sessionType === managerType)
      );
    });

    return {
      weekday: weekdayKey,
      isScheduled,
      holiday,
      blocked: !isScheduled || Boolean(holiday),
    };
  }, [holidays, managerDate, managerType, weeklySchedule]);

  const visibleHolidays = showAllHolidays ? holidays : holidays.slice(0, 5);

  const swimmerDayStatuses = useMemo(() => {
    const map = new Map<
      string,
      {
        swimming?: AttendanceRecord["status"];
        land?: AttendanceRecord["status"];
      }
    >();

    for (const record of calendarRecords) {
      const dayKey = toIsoDate(record.date);
      const existing = map.get(dayKey) || {};
      existing[record.type] = record.status;
      map.set(dayKey, existing);
    }

    return map;
  }, [calendarRecords]);

  const markAttendance = async (
    swimmerId: string,
    status: "present" | "absent-unrequested" | "absent-approved",
  ) => {
    if (selectedPracticeMeta.blocked && !overrideNoPractice) {
      toast.error("Selected date is marked as no-practice. Enable override.");
      return;
    }

    setIsMarking(true);
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: swimmerId,
          date: managerDate,
          type: managerType,
          status,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to mark attendance");
        return;
      }

      toast.success(
        status === "present"
          ? "Marked present"
          : status === "absent-approved"
            ? "Marked approved absence"
            : "Marked absent (unrequested)",
      );
      await Promise.all([loadManagerRecords(), loadCalendarRecords()]);
    } catch {
      toast.error("Network error while marking attendance");
    } finally {
      setIsMarking(false);
    }
  };

  if (!isManager) {
    return (
      <div className="space-y-6">
        <h1 className="section-heading">Attendance</h1>

        <Card>
          <h2 className="text-xl font-semibold text-primary-300 mb-3">
            Request Leave
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Select
              label="Session Type"
              value={type}
              onChange={(e) => setType(e.target.value as "swimming" | "land")}
              options={[
                { value: "swimming", label: "Swimming" },
                { value: "land", label: "Land / Dryland" },
              ]}
            />
            <Select
              label="Leave Type"
              value={leaveType}
              onChange={(e) =>
                setLeaveType(e.target.value as keyof typeof LEAVE_TYPES)
              }
              options={Object.entries(LEAVE_TYPES).map(([value, label]) => ({
                value,
                label,
              }))}
            />
            <Input
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                leaveType === "other" ? "Reason required for other" : "Optional"
              }
            />
          </div>
          <div className="mt-4">
            <Button onClick={onRequestLeave} isLoading={isSubmitting}>
              Submit Request
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h2 className="text-xl font-semibold text-primary-300">
              Approved Leave Count By Type
            </h2>
            <Input
              label="Month"
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {Object.entries(LEAVE_TYPES).map(([key, label]) => (
              <div
                key={key}
                className="rounded border border-primary-500/20 p-3 bg-primary-500/5"
              >
                <p className="text-sm text-gray-300">{label}</p>
                <p className="text-2xl text-green-400 font-semibold">
                  {swimmerMonthSummary?.byLeaveType?.[key] || 0}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-primary-300 mb-3">
            My Attendance Calendar
          </h2>
          <p className="text-sm text-slate-600 dark:text-gray-400 mb-3">
            Day-by-day status for swimming and land sessions, including
            holidays/no-practice days.
          </p>

          <div className="grid grid-cols-7 gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400 mb-2">
            <p>Mon</p>
            <p>Tue</p>
            <p>Wed</p>
            <p>Thu</p>
            <p>Fri</p>
            <p>Sat</p>
            <p>Sun</p>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {monthGrid.map((cellDate, index) => {
              if (!cellDate) {
                return (
                  <div
                    key={`swimmer-empty-${index}`}
                    className="h-24 rounded border border-transparent"
                  />
                );
              }

              const dayNumber = Number(cellDate.slice(-2));
              const dayStatuses = swimmerDayStatuses.get(cellDate);
              const holidayForDate = holidays.find(
                (item) => item.date === cellDate,
              );

              return (
                <div
                  key={`swimmer-${cellDate}`}
                  className={`h-24 rounded border p-2 ${
                    holidayForDate
                      ? "border-yellow-500/40 bg-yellow-500/10"
                      : "border-primary-500/20"
                  }`}
                  title={
                    holidayForDate
                      ? `Holiday: ${holidayForDate.reason || "No reason provided"}`
                      : undefined
                  }
                >
                  <p className="text-sm font-semibold text-slate-800 dark:text-gray-100">
                    {dayNumber}
                  </p>
                  {holidayForDate && (
                    <p className="text-[10px] uppercase tracking-wide text-yellow-600 dark:text-yellow-300">
                      Holiday
                    </p>
                  )}
                  <div className="mt-1 space-y-1 text-[10px]">
                    <p className="text-slate-600 dark:text-gray-400">
                      S:{" "}
                      {dayStatuses?.swimming ? (
                        <span
                          title={
                            STATUS_LABELS[dayStatuses.swimming] ||
                            dayStatuses.swimming
                          }
                          className={`inline-block rounded border px-1 ${
                            STATUS_BADGE_STYLES[dayStatuses.swimming] ||
                            "border-primary-500/20 text-gray-300"
                          }`}
                        >
                          {STATUS_SHORT_LABELS[dayStatuses.swimming] ||
                            dayStatuses.swimming}
                        </span>
                      ) : (
                        "-"
                      )}
                    </p>
                    <p className="text-slate-600 dark:text-gray-400">
                      L:{" "}
                      {dayStatuses?.land ? (
                        <span
                          title={
                            STATUS_LABELS[dayStatuses.land] || dayStatuses.land
                          }
                          className={`inline-block rounded border px-1 ${
                            STATUS_BADGE_STYLES[dayStatuses.land] ||
                            "border-primary-500/20 text-gray-300"
                          }`}
                        >
                          {STATUS_SHORT_LABELS[dayStatuses.land] ||
                            dayStatuses.land}
                        </span>
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded border border-primary-500/20 bg-primary-500/5 p-3">
            <p className="text-sm font-medium text-slate-800 dark:text-gray-100 mb-2">
              Legend
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <p className="text-slate-700 dark:text-gray-300">
                <span className="font-semibold">S</span> = Swimming session
              </p>
              <p className="text-slate-700 dark:text-gray-300">
                <span className="font-semibold">L</span> = Land session
              </p>
              <p className="text-slate-700 dark:text-gray-300">
                <span className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 mr-1 text-blue-300">
                  P
                </span>
                Present
              </p>
              <p className="text-slate-700 dark:text-gray-300">
                <span className="inline-block rounded border border-green-500/30 bg-green-500/15 px-1 mr-1 text-green-300">
                  AL
                </span>
                Approved Leave
              </p>
              <p className="text-slate-700 dark:text-gray-300">
                <span className="inline-block rounded border border-red-500/30 bg-red-500/15 px-1 mr-1 text-red-300">
                  ABS
                </span>
                Absent (includes pending/rejected leave)
              </p>
            </div>
            <p className="text-xs text-slate-600 dark:text-gray-400 mt-2">
              Yellow-highlighted day cells indicate configured holiday or
              no-practice.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-primary-300 mb-3">
            My Leave Requests
          </h2>
          {records.length === 0 ? (
            <p className="text-gray-400">No leave requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Leave Type</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record._id}>
                      <td>{formatDate(record.date)}</td>
                      <td className="capitalize">{record.type}</td>
                      <td
                        className={`capitalize font-medium ${STATUS_STYLES[record.status] || "text-gray-200"}`}
                      >
                        {record.status.replaceAll("-", " ")}
                      </td>
                      <td>{record.leaveType || "-"}</td>
                      <td>{record.reason || "-"}</td>
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

  return (
    <div className="space-y-6">
      <h1 className="section-heading">Attendance Management</h1>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Month"
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          />
          <Select
            label="Session"
            value={managerType}
            onChange={(e) =>
              setManagerType(e.target.value as "swimming" | "land")
            }
            options={[
              { value: "swimming", label: "Swimming" },
              { value: "land", label: "Land / Dryland" },
            ]}
          />
          <Select
            label="Status Filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "all", label: "All" },
              { value: "absent-requested", label: "Pending" },
              { value: "absent-approved", label: "Approved" },
              { value: "absent-unrequested", label: "Rejected" },
              { value: "present", label: "Present" },
            ]}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-primary-300 mb-3">
          Daily Attendance
        </h2>

        <div className="grid grid-cols-7 gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400 mb-2">
          <p>Mon</p>
          <p>Tue</p>
          <p>Wed</p>
          <p>Thu</p>
          <p>Fri</p>
          <p>Sat</p>
          <p>Sun</p>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {monthGrid.map((cellDate, index) => {
            if (!cellDate) {
              return (
                <div
                  key={`empty-${index}`}
                  className="h-24 rounded border border-transparent"
                />
              );
            }

            const daySummary = daySummaries.get(cellDate);
            const selected = cellDate === managerDate;
            const dayNumber = Number(cellDate.slice(-2));
            const holidayForDate = holidays.find((item) => {
              return (
                item.date === cellDate &&
                (item.sessionType === "none" ||
                  item.sessionType === managerType)
              );
            });

            return (
              <button
                key={cellDate}
                type="button"
                onClick={() => setManagerDate(cellDate)}
                title={
                  holidayForDate
                    ? `Holiday: ${holidayForDate.reason || "No reason provided"}`
                    : undefined
                }
                className={`h-24 rounded border p-2 text-left transition ${
                  selected
                    ? "border-primary-300 bg-primary-500/10"
                    : holidayForDate
                      ? "border-yellow-500/40 bg-yellow-500/10 hover:border-yellow-500/60"
                      : "border-primary-500/20 hover:border-primary-400"
                }`}
              >
                <p className="text-sm font-semibold text-slate-800 dark:text-gray-100">
                  {dayNumber}
                </p>
                {holidayForDate && (
                  <p className="text-[10px] uppercase tracking-wide text-yellow-600 dark:text-yellow-300">
                    Holiday
                  </p>
                )}
                <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                  <span className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 text-blue-300">
                    P {daySummary?.present || 0}
                  </span>
                  <span className="inline-block rounded border border-green-500/30 bg-green-500/15 px-1 text-green-300">
                    AL {daySummary?.approved || 0}
                  </span>
                  <span className="inline-block rounded border border-red-500/30 bg-red-500/15 px-1 text-red-300">
                    ABS {daySummary?.absent || 0}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded border border-primary-500/20 bg-primary-500/5 p-3">
          <p className="text-sm font-medium text-slate-800 dark:text-gray-100 mb-2">
            Calendar Legend
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <p className="text-slate-700 dark:text-gray-300">
              <span className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-1 mr-1 text-blue-300">
                P
              </span>
              Present count
            </p>
            <p className="text-slate-700 dark:text-gray-300">
              <span className="inline-block rounded border border-green-500/30 bg-green-500/15 px-1 mr-1 text-green-300">
                AL
              </span>
              Approved leave count
            </p>
            <p className="text-slate-700 dark:text-gray-300">
              <span className="inline-block rounded border border-red-500/30 bg-red-500/15 px-1 mr-1 text-red-300">
                ABS
              </span>
              Absent count
            </p>
          </div>
        </div>

        <div className="mt-4 border border-primary-500/20 rounded p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-200">
              Selected:{" "}
              <span className="font-semibold">{formatDate(managerDate)}</span> (
              {selectedPracticeMeta.weekday})
            </p>
            <Input
              label="Selected Date"
              type="date"
              value={managerDate}
              onChange={(e) => setManagerDate(e.target.value)}
            />
          </div>

          {selectedPracticeMeta.blocked && (
            <div className="rounded border border-yellow-500/40 bg-yellow-500/10 p-2 text-sm text-yellow-200">
              <p>
                {selectedPracticeMeta.holiday
                  ? `Holiday / no-practice: ${selectedPracticeMeta.holiday.reason || "No reason provided"}`
                  : "Weekly schedule marks this session as no-practice."}
              </p>
              <label className="mt-2 inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={overrideNoPractice}
                  onChange={(e) => setOverrideNoPractice(e.target.checked)}
                />
                <span>Allow override and still mark attendance</span>
              </label>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-300 mb-2">
              Mark attendance for selected date and session:
            </p>
            {swimmers.length === 0 ? (
              <p className="text-gray-400 text-sm">No swimmers found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Swimmer</th>
                      <th>Current Status</th>
                      <th>Mark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {swimmers.map((swimmer) => {
                      const selectedStatus = selectedStatusByUser.get(
                        swimmer._id,
                      );
                      return (
                        <tr key={swimmer._id}>
                          <td>{swimmer.name}</td>
                          <td
                            className={`capitalize font-medium ${
                              selectedStatus
                                ? STATUS_STYLES[selectedStatus]
                                : "text-gray-400"
                            }`}
                          >
                            {selectedStatus
                              ? selectedStatus.replaceAll("-", " ")
                              : "not marked"}
                          </td>
                          <td>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant={
                                  selectedStatus === "present"
                                    ? "primary"
                                    : "secondary"
                                }
                                isLoading={isMarking}
                                onClick={() =>
                                  void markAttendance(swimmer._id, "present")
                                }
                              >
                                Present
                              </Button>
                              <Button
                                size="sm"
                                variant={
                                  selectedStatus === "absent-approved"
                                    ? "primary"
                                    : "secondary"
                                }
                                isLoading={isMarking}
                                onClick={() =>
                                  void markAttendance(
                                    swimmer._id,
                                    "absent-approved",
                                  )
                                }
                              >
                                Approved Leave
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                isLoading={isMarking}
                                onClick={() =>
                                  void markAttendance(
                                    swimmer._id,
                                    "absent-unrequested",
                                  )
                                }
                              >
                                Absent
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-300 mb-2">
              Recorded for selected date and session ({managerType}):
            </p>
            {selectedDateRecords.length === 0 ? (
              <p className="text-gray-400 text-sm">No records marked yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Swimmer</th>
                      <th>Status</th>
                      <th>Leave Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDateRecords.map((record) => (
                      <tr key={record._id}>
                        <td>{record.userName || record.userId}</td>
                        <td
                          className={`capitalize font-medium ${STATUS_STYLES[record.status] || "text-gray-200"}`}
                        >
                          {record.status.replaceAll("-", " ")}
                        </td>
                        <td>{record.leaveType || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-primary-300 mb-3">
          Attendance Logs
        </h2>
        {records.length === 0 ? (
          <p className="text-gray-400">No attendance records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Swimmer</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Leave Type</th>
                  <th>Reason</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id}>
                    <td>{record.userName || record.userId}</td>
                    <td>{formatDate(record.date)}</td>
                    <td className="capitalize">{record.type}</td>
                    <td
                      className={`capitalize font-medium ${STATUS_STYLES[record.status] || "text-gray-200"}`}
                    >
                      {record.status.replaceAll("-", " ")}
                    </td>
                    <td>{record.leaveType || "-"}</td>
                    <td>{record.reason || "-"}</td>
                    <td>
                      {record.status === "absent-requested" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => void onApprove(record._id, true)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => void onApprove(record._id, false)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">No action</span>
                      )}
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
          Monthly Swimmer Summary
        </h2>
        {summaryRows.length === 0 ? (
          <p className="text-gray-400">No swimmer summary for this month.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Swimmer</th>
                  <th>Approved</th>
                  <th>Pending</th>
                  <th>Rejected</th>
                  <th>Leave Type Breakdown</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((row) => (
                  <tr key={row.userId}>
                    <td>{row.userName}</td>
                    <td className="text-green-400">{row.approved}</td>
                    <td className="text-yellow-300">{row.pending}</td>
                    <td className="text-red-400">{row.rejected}</td>
                    <td>
                      {Object.entries(row.byLeaveType).length === 0
                        ? "-"
                        : Object.entries(row.byLeaveType)
                            .map(([key, count]) => `${key}: ${count}`)
                            .join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-xl font-semibold text-primary-300 mb-3">
            Weekly Practice Schedule
          </h2>
          <div className="space-y-3">
            {WEEKDAYS.map((day) => (
              <Select
                key={day}
                label={day.charAt(0).toUpperCase() + day.slice(1)}
                value={weeklySchedule[day]}
                onChange={(e) =>
                  setWeeklySchedule((prev) => ({
                    ...prev,
                    [day]: e.target.value as "swimming" | "land" | "none",
                  }))
                }
                options={[
                  { value: "swimming", label: "Swimming" },
                  { value: "land", label: "Land" },
                  { value: "none", label: "No Practice" },
                ]}
              />
            ))}
            <Button onClick={saveSchedule}>Save Weekly Schedule</Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-primary-300 mb-3">
            Holiday / No-Practice Days
          </h2>
          <div className="space-y-3">
            <Input
              label="Date"
              type="date"
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
            />
            <Select
              label="Affected Session"
              value={holidayType}
              onChange={(e) =>
                setHolidayType(e.target.value as "swimming" | "land" | "none")
              }
              options={[
                { value: "none", label: "All / General Holiday" },
                { value: "swimming", label: "Swimming Session" },
                { value: "land", label: "Land Session" },
              ]}
            />
            <Input
              label="Reason"
              value={holidayReason}
              onChange={(e) => setHolidayReason(e.target.value)}
              placeholder="Public holiday / meet / cancellation"
            />
            <Button onClick={addHoliday}>Add / Update Holiday</Button>
          </div>

          <div className="mt-4 space-y-2 max-h-52 overflow-auto">
            {holidays.length === 0 ? (
              <p className="text-gray-400">No holidays configured.</p>
            ) : (
              visibleHolidays.map((holiday) => (
                <div
                  key={holiday.date}
                  className="border border-primary-500/20 rounded p-2 flex items-center justify-between gap-3"
                >
                  <div className="text-sm">
                    <p className="text-slate-800 dark:text-gray-100">
                      {holiday.date} ({holiday.sessionType})
                    </p>
                    <p className="text-slate-600 dark:text-gray-400">
                      {holiday.reason || "-"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => void removeHoliday(holiday.date)}
                  >
                    Remove
                  </Button>
                </div>
              ))
            )}
            {holidays.length > 5 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowAllHolidays((prev) => !prev)}
              >
                {showAllHolidays
                  ? "Show Recent 5"
                  : `Show All (${holidays.length})`}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
