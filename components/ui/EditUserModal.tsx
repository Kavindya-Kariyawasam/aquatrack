"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type Props = {
  open: boolean;
  onClose: () => void;
  user: {
    _id: string;
    email: string;
    profile?: Record<string, any> | null;
  } | null;
  onSaved?: (updatedUser: any) => void;
};

export default function EditUserModal({ open, onClose, user, onSaved }: Props) {
  const [gender, setGender] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setGender(String(user.profile?.gender || ""));
      setFullName(String(user.profile?.fullName || ""));
    } else {
      setGender("");
      setFullName("");
    }
  }, [user]);

  if (!open || !user) return null;

  const onSave = async () => {
    setIsSaving(true);
    try {
      const payload: any = { userId: user._id, profile: {} };
      if (gender) payload.profile.gender = gender;
      if (fullName) payload.profile.fullName = fullName;

      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save user");
      }

      onSaved?.(data.user);
      onClose();
    } catch (err: any) {
      // best-effort toast if available, otherwise console
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const toast = require("react-hot-toast").default;
        toast.error(err?.message || "Failed to save user");
      } catch {
        // ignore
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          if (!isSaving) onClose();
        }}
      />

      <Card>
        <div className="w-[520px] p-4">
          <h3 className="text-lg font-semibold mb-3">Edit user details</h3>
          <p className="text-sm text-gray-400 mb-3">
            Editing user: <strong>{user.email}</strong>
          </p>

          <div className="space-y-3">
            <label className="block">
              <div className="text-sm text-gray-300 mb-1">Full name</div>
              <input
                className="input-field w-full"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
              />
            </label>

            <label className="block">
              <div className="text-sm text-gray-300 mb-1">Gender</div>
              <select
                className="input-field w-full"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Unassigned</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={onSave} isLoading={isSaving}>
              Save changes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
