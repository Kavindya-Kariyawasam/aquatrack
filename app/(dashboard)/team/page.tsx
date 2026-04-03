"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import { SWIMMING_EVENTS } from "@/lib/constants";

type UserItem = {
  _id: string;
  email: string;
  role: "swimmer" | "coach" | "admin";
  isApproved?: boolean;
  profile?: {
    fullName?: string;
    gender?: "male" | "female" | "";
    dob?: string;
    universityId?: string;
    faculty?: string;
    batch?: number;
    contact?: string;
    emergencyContact?: string;
    mainEvents?: string[];
    extraEvents?: string[];
  };
};

function eventTag(user: UserItem, eventName: string): string {
  const main = user.profile?.mainEvents || [];
  const reserve = user.profile?.extraEvents || [];
  if (main.includes(eventName)) return "Main";
  if (reserve.includes(eventName)) return "Reserve";
  return "";
}

export default function TeamPage() {
  const [users, setUsers] = useState<UserItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (response.ok) {
        setUsers(
          (data.users || []).filter((u: UserItem) => u.role === "swimmer"),
        );
      }
    };

    void load();
  }, []);

  const { men, women, unassigned } = useMemo(() => {
    const swimmers = users.filter((user) => user.isApproved);
    return {
      men: swimmers.filter((user) => user.profile?.gender === "male"),
      women: swimmers.filter((user) => user.profile?.gender === "female"),
      unassigned: swimmers.filter((user) => !user.profile?.gender),
    };
  }, [users]);

  const renderTable = (title: string, rows: UserItem[]) => (
    <Card>
      <h2 className="text-xl font-semibold text-primary-300 mb-3">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-gray-400">No swimmers in this section.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>DOB</th>
                <th>ID</th>
                <th>Faculty</th>
                <th>Batch</th>
                <th>Contact</th>
                <th>Emergency</th>
                {SWIMMING_EVENTS.map((event) => (
                  <th key={event}>{event}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => (
                <tr key={user._id}>
                  <td>{user.profile?.fullName || "-"}</td>
                  <td>
                    {user.profile?.dob
                      ? new Date(user.profile.dob).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{user.profile?.universityId || "-"}</td>
                  <td>{user.profile?.faculty || "-"}</td>
                  <td>{user.profile?.batch || "-"}</td>
                  <td>{user.profile?.contact || "-"}</td>
                  <td>{user.profile?.emergencyContact || "-"}</td>
                  {SWIMMING_EVENTS.map((event) => (
                    <td key={`${user._id}-${event}`}>
                      {eventTag(user, event) ? (
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            eventTag(user, event) === "Main"
                              ? "bg-primary-500/20 text-primary-200"
                              : "bg-yellow-500/20 text-yellow-200"
                          }`}
                        >
                          {eventTag(user, event)}
                        </span>
                      ) : (
                        ""
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <h1 className="section-heading">Team Details</h1>
      {renderTable("Mens Team", men)}
      {renderTable("Womens Team", women)}
      {renderTable("Unassigned", unassigned)}
    </div>
  );
}
