"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { FACULTIES, SWIMMING_EVENTS } from "@/lib/constants";

type Role = "swimmer" | "coach" | "admin";

type ProfileState = {
  fullName: string;
  callingName: string;
  gender: string;
  dob: string;
  contact: string;
  emergencyContact: string;
  faculty: string;
  batch: string;
  universityId: string;
  nicNumber: string;
  mainEvents: string[];
  extraEvents: string[];
};

const initialState: ProfileState = {
  fullName: "",
  callingName: "",
  gender: "",
  dob: "",
  contact: "",
  emergencyContact: "",
  faculty: "",
  batch: "",
  universityId: "",
  nicNumber: "",
  mainEvents: [],
  extraEvents: [],
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileState>(initialState);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("swimmer");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/users/profile");
        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || "Failed to load profile");
          return;
        }

        const user = data.user;
        const p = user.profile || {};

        setEmail(user.email || "");
        setRole((user.role || "swimmer") as Role);

        setProfile({
          fullName: p.fullName || "",
          callingName: p.callingName || "",
          gender: p.gender || "",
          dob: p.dob ? new Date(p.dob).toISOString().slice(0, 10) : "",
          contact: p.contact || "",
          emergencyContact: p.emergencyContact || "",
          faculty: p.faculty || "",
          batch: p.batch ? String(p.batch) : "",
          universityId: p.universityId || "",
          nicNumber: p.nicNumber || "",
          mainEvents: Array.isArray(p.mainEvents) ? p.mainEvents : [],
          extraEvents: Array.isArray(p.extraEvents) ? p.extraEvents : [],
        });
      } catch {
        toast.error("Failed to load profile");
      }
    };

    void loadProfile();
  }, []);

  const updateField = (key: keyof ProfileState, value: string | string[]) => {
    setProfile((previous) => ({ ...previous, [key]: value }));
  };

  const toggleMainEvent = (event: string) => {
    setProfile((previous) => {
      const exists = previous.mainEvents.includes(event);
      if (exists) {
        return {
          ...previous,
          mainEvents: previous.mainEvents.filter((item) => item !== event),
        };
      }

      if (previous.mainEvents.length >= 3) {
        toast.error("You can select up to 3 main events");
        return previous;
      }

      return {
        ...previous,
        mainEvents: [...previous.mainEvents, event],
        extraEvents: previous.extraEvents.filter((item) => item !== event),
      };
    });
  };

  const toggleExtraEvent = (event: string) => {
    setProfile((previous) => {
      if (previous.mainEvents.includes(event)) {
        toast.error("This event is already selected as a main event");
        return previous;
      }

      const exists = previous.extraEvents.includes(event);
      if (exists) {
        return {
          ...previous,
          extraEvents: previous.extraEvents.filter((item) => item !== event),
        };
      }

      if (previous.extraEvents.length >= 2) {
        toast.error("You can select up to 2 reserve events");
        return previous;
      }

      return {
        ...previous,
        extraEvents: [...previous.extraEvents, event],
      };
    });
  };

  const onSave = async () => {
    setIsLoading(true);

    try {
      const payload: Record<string, unknown> = {
        fullName: profile.fullName,
        callingName: profile.callingName,
        gender: profile.gender,
        dob: profile.dob || undefined,
        contact: profile.contact,
        emergencyContact: profile.emergencyContact,
      };

      if (role === "swimmer") {
        payload.faculty = profile.faculty;
        payload.batch = profile.batch ? Number(profile.batch) : undefined;
        payload.universityId = profile.universityId;
        payload.nicNumber = profile.nicNumber;
        payload.mainEvents = profile.mainEvents;
        payload.extraEvents = profile.extraEvents;
      }

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to save profile");
        return;
      }

      toast.success("Profile updated");
    } catch {
      toast.error("Network error while saving profile");
    } finally {
      setIsLoading(false);
    }
  };

  const isSwimmer = role === "swimmer";

  return (
    <div className="space-y-4">
      <h1 className="section-heading">Profile</h1>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input label="Email" value={email} disabled />
          <Input label="Role" value={role} disabled />
          <Input
            label="Full Name"
            value={profile.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
          />
          <Input
            label="Calling Name"
            value={profile.callingName}
            onChange={(event) => updateField("callingName", event.target.value)}
          />
          <Select
            label="Gender"
            value={profile.gender}
            onChange={(event) => updateField("gender", event.target.value)}
            options={[
              { value: "", label: "Select gender" },
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
          <Input
            label="Date of Birth"
            type="date"
            value={profile.dob}
            onChange={(event) => updateField("dob", event.target.value)}
          />
          <Input
            label="Contact"
            value={profile.contact}
            onChange={(event) => updateField("contact", event.target.value)}
          />
          <Input
            label="Emergency Contact"
            value={profile.emergencyContact}
            onChange={(event) =>
              updateField("emergencyContact", event.target.value)
            }
          />

          {isSwimmer && (
            <>
              <Select
                label="Faculty"
                value={profile.faculty}
                onChange={(event) => updateField("faculty", event.target.value)}
                options={[
                  { value: "", label: "Select faculty" },
                  ...FACULTIES.map((faculty) => ({
                    value: faculty,
                    label: faculty,
                  })),
                ]}
              />
              <Input
                label="Batch"
                type="number"
                value={profile.batch}
                onChange={(event) => updateField("batch", event.target.value)}
              />
              <Input
                label="University ID"
                value={profile.universityId}
                onChange={(event) =>
                  updateField("universityId", event.target.value)
                }
              />
              <Input
                label="NIC Number"
                value={profile.nicNumber}
                onChange={(event) =>
                  updateField("nicNumber", event.target.value)
                }
              />
            </>
          )}
        </div>

        {isSwimmer && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">
                Main Events (choose up to 3)
              </p>
              <div className="space-y-2 max-h-72 overflow-auto pr-2 border border-primary-500/20 rounded-lg p-3">
                {SWIMMING_EVENTS.map((event) => (
                  <label
                    key={`main-${event}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={profile.mainEvents.includes(event)}
                      onChange={() => toggleMainEvent(event)}
                    />
                    <span>{event}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
                Note: Women&apos;s category currently does not include 400
                freestyle, 200 backstroke, 200 breaststroke, or 200 butterfly.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">
                Reserve Events (choose up to 2)
              </p>
              <div className="space-y-2 max-h-72 overflow-auto pr-2 border border-primary-500/20 rounded-lg p-3">
                {SWIMMING_EVENTS.map((event) => (
                  <label
                    key={`extra-${event}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={profile.extraEvents.includes(event)}
                      onChange={() => toggleExtraEvent(event)}
                      disabled={profile.mainEvents.includes(event)}
                    />
                    <span>{event}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={onSave} isLoading={isLoading}>
            Save Profile
          </Button>
        </div>
      </Card>
    </div>
  );
}
