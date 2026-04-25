"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import { getAuthMeUser } from "@/lib/authMeClient";

type Role = "swimmer" | "coach" | "admin";
type Gender = "male" | "female";

type ResultRow = {
  meet_name: string;
  meet_year: string;
  meet_type: string;
  gender: Gender;
  event_name: string;
  rank: number;
  swimmer_name: string;
  university: string;
  time: string;
  round_used: string;
  source_page: string;
  extraction_notes: string;
};

function parseCsvLine(line: string): string[] {
  // The source file may contain commas in extraction notes without strict quotes.
  // Keep first 11 columns fixed and merge the remainder as extraction_notes.
  const parts = line.split(",");
  if (parts.length <= 12) {
    while (parts.length < 12) {
      parts.push("");
    }
    return parts;
  }

  const fixed = parts.slice(0, 11);
  fixed.push(parts.slice(11).join(","));
  return fixed;
}

function normalizeEventName(eventName: string): string {
  return eventName.trim().toLowerCase();
}

export default function PastResultsPage() {
  const [role, setRole] = useState<Role>("swimmer");
  const [profileGender, setProfileGender] = useState<"male" | "female" | "">(
    "",
  );
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeetKey, setSelectedMeetKey] = useState("");
  const [openEventByGender, setOpenEventByGender] = useState<
    Partial<Record<Gender, string>>
  >({});

  useEffect(() => {
    const load = async () => {
      try {
        const [user, csvRes] = await Promise.all([
          getAuthMeUser(),
          fetch("/data/SLUG2025.csv"),
        ]);
        const csvText = await csvRes.text();

        if (user?.role) {
          setRole(user.role as Role);
          setProfileGender((user.gender || "") as "male" | "female" | "");
        }

        const lines = csvText
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

        if (lines.length <= 1) {
          setRows([]);
          return;
        }

        const parsedRows: ResultRow[] = lines
          .slice(1)
          .map((line) => parseCsvLine(line))
          .map((cols) => ({
            meet_name: cols[0] || "",
            meet_year: cols[1] || "",
            meet_type: cols[2] || "",
            gender: (String(cols[3] || "").toLowerCase() === "female"
              ? "female"
              : "male") as Gender,
            event_name: normalizeEventName(cols[4] || ""),
            rank: Number(cols[5] || 0),
            swimmer_name: cols[6] || "",
            university: cols[7] || "",
            time: cols[8] || "",
            round_used: cols[9] || "",
            source_page: cols[10] || "",
            extraction_notes: cols[11] || "",
          }))
          .filter((row) => row.event_name && row.rank >= 1 && row.rank <= 5);

        setRows(parsedRows);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const visibleGenders = useMemo(() => {
    if (role === "admin" || role === "coach") {
      return ["male", "female"] as Gender[];
    }

    if (profileGender === "male" || profileGender === "female") {
      return [profileGender] as Gender[];
    }

    return ["male", "female"] as Gender[];
  }, [profileGender, role]);

  const meetOptions = useMemo(() => {
    const map = new Map<
      string,
      { key: string; label: string; yearNum: number }
    >();

    for (const row of rows) {
      const key = `${row.meet_type}|${row.meet_year}|${row.meet_name}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: `${row.meet_type} ${row.meet_year} - ${row.meet_name}`,
          yearNum: Number(row.meet_year) || 0,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.yearNum - a.yearNum);
  }, [rows]);

  useEffect(() => {
    if (!selectedMeetKey && meetOptions.length > 0) {
      setSelectedMeetKey(meetOptions[0].key);
    }
  }, [meetOptions, selectedMeetKey]);

  const selectedMeetRows = useMemo(() => {
    if (!selectedMeetKey) return [] as ResultRow[];

    const [meetType, meetYear, meetName] = selectedMeetKey.split("|");

    return rows.filter(
      (row) =>
        row.meet_type === meetType &&
        row.meet_year === meetYear &&
        row.meet_name === meetName,
    );
  }, [rows, selectedMeetKey]);

  const eventsByGender = useMemo(() => {
    const result: Record<Gender, string[]> = { male: [], female: [] };

    for (const gender of visibleGenders) {
      const events = Array.from(
        new Set(
          selectedMeetRows
            .filter((row) => row.gender === gender)
            .map((row) => row.event_name),
        ),
      ).sort((a, b) => a.localeCompare(b));

      result[gender] = events;
    }

    return result;
  }, [selectedMeetRows, visibleGenders]);

  const rowsForEvent = (gender: Gender, eventName: string) => {
    return selectedMeetRows
      .filter((row) => row.gender === gender && row.event_name === eventName)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 5);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="section-heading">Past Meet Results</h1>
        <Card>
          <p className="text-gray-400">Loading past results...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="section-heading">Past Meet Results</h1>

      <Card>
        <h2 className="text-xl font-semibold text-primary-300 mb-3">
          Meet Selection
        </h2>
        {meetOptions.length === 0 ? (
          <p className="text-gray-400">No past meet data found.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-gray-400">
              Showing top 5 finalists per event. Swimmers see gender-scoped
              results by profile; coaches/admin see both.
            </p>
            <select
              value={selectedMeetKey}
              onChange={(event) => setSelectedMeetKey(event.target.value)}
              className="input-field w-full md:w-auto min-w-[280px]"
            >
              {meetOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </Card>

      {visibleGenders.map((gender) => {
        const events = eventsByGender[gender] || [];

        return (
          <Card key={gender}>
            <h2 className="text-xl font-semibold text-primary-300 mb-3 capitalize">
              {gender} Results
            </h2>
            {events.length === 0 ? (
              <p className="text-gray-400">
                No events available for this category.
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((eventName) => {
                  const isOpen = openEventByGender[gender] === eventName;
                  const eventRows = rowsForEvent(gender, eventName);

                  return (
                    <div
                      key={`${gender}-${eventName}`}
                      className="border border-primary-500/20 rounded-lg"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenEventByGender((previous) => ({
                            ...previous,
                            [gender]:
                              previous[gender] === eventName ? "" : eventName,
                          }))
                        }
                        className="w-full flex items-center justify-between p-3 text-left"
                      >
                        <span className="font-medium text-slate-800 dark:text-gray-100 capitalize">
                          {eventName}
                        </span>
                        <span className="text-xs text-primary-300">
                          {isOpen ? "Hide" : "Show top 5"}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-3 pb-3">
                          <div className="overflow-x-auto">
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Rank</th>
                                  <th>Swimmer</th>
                                  <th>University</th>
                                  <th>Time</th>
                                </tr>
                              </thead>
                              <tbody>
                                {eventRows.map((row) => (
                                  <tr
                                    key={`${gender}-${eventName}-${row.rank}-${row.swimmer_name}`}
                                  >
                                    <td>{row.rank}</td>
                                    <td>{row.swimmer_name}</td>
                                    <td>{row.university}</td>
                                    <td>{row.time}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
