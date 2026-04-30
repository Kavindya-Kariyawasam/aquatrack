"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EditUserModal from "@/components/ui/EditUserModal";
import { getAuthMeUser } from "@/lib/authMeClient";
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
    nicNumber?: string;
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

function compareSwimmersByName(a: UserItem, b: UserItem): number {
  const aName = (a.profile?.fullName || a.email || "").trim().toLowerCase();
  const bName = (b.profile?.fullName || b.email || "").trim().toLowerCase();
  return aName.localeCompare(bName);
}

export default function TeamPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [role, setRole] = useState<string>("swimmer");
  const [isRoleLoaded, setIsRoleLoaded] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  useEffect(() => {
    const load = async () => {
      const [me, res] = await Promise.all([
        getAuthMeUser(),
        fetch("/api/users"),
      ]);
      try {
        if (me?.role) setRole(me.role as string);
      } finally {
        setIsRoleLoaded(true);
      }

      const data = await res.json();
      if (res.ok) {
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
      men: swimmers
        .filter((user) => user.profile?.gender === "male")
        .sort(compareSwimmersByName),
      women: swimmers
        .filter((user) => user.profile?.gender === "female")
        .sort(compareSwimmersByName),
      unassigned: swimmers
        .filter((user) => !user.profile?.gender)
        .sort(compareSwimmersByName),
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
                <th className="sticky left-0 top-0 z-40 bg-slate-100 dark:bg-dark-card/80 w-12 text-left">
                  #
                </th>
                <th
                  className="sticky left-12 top-0 z-40 bg-slate-100 dark:bg-dark-card/80 text-left"
                  style={{ left: "48px" }}
                >
                  Full Name
                </th>
                {role === "admin" && (
                  <th className="top-0 sticky z-30 bg-slate-100 dark:bg-dark-card/80">
                    Actions
                  </th>
                )}
                <th>DOB</th>
                <th>ID</th>
                <th>NIC</th>
                <th>Faculty</th>
                <th>Batch</th>
                <th>Contact</th>
                <th>Emergency</th>
                {SWIMMING_EVENTS.map((event) => (
                  <th
                    key={event}
                    className="top-0 sticky z-20 bg-slate-100 dark:bg-dark-card/80"
                  >
                    {event}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((user, index) => (
                <tr key={user._id}>
                  <td className="sticky left-0 bg-white dark:bg-dark-card z-40 text-sm px-4 py-3">
                    {index + 1}
                  </td>
                  <td
                    className="sticky left-12 bg-white dark:bg-dark-card z-30 px-4 py-3"
                    style={{ left: "48px" }}
                  >
                    {user.profile?.fullName || "-"}
                  </td>
                  {role === "admin" && (
                    <td>
                      <Button
                        variant="ghost"
                        onClick={() => setEditingUser(user)}
                      >
                        Edit
                      </Button>
                    </td>
                  )}
                  <td>
                    {user.profile?.dob
                      ? new Date(user.profile.dob).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{user.profile?.universityId || "-"}</td>
                  <td>{user.profile?.nicNumber || "-"}</td>
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
                              ? "bg-sky-100 text-sky-800 dark:bg-primary-500/20 dark:text-primary-200"
                              : "bg-amber-100 text-amber-800 dark:bg-yellow-500/20 dark:text-yellow-200"
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

      <EditUserModal
        open={Boolean(editingUser)}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={(updated) => {
          if (!updated || !updated._id) return;
          setUsers((prev) =>
            prev.map((u) =>
              String(u._id) === String(updated._id) ? { ...u, ...updated } : u,
            ),
          );
        }}
      />
    </div>
  );
}
