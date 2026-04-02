"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get("token") || "";
    if (queryToken) {
      setToken(queryToken);
    }
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Reset failed");
        return;
      }

      toast.success("Password reset successful");
      router.push("/login");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md" hover>
        <h1 className="section-heading mb-2">Reset Password</h1>
        <p className="text-gray-400 mb-6">
          Set a new password for your account
        </p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Reset Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste reset token"
            required
          />
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                New Password
              </label>
              <button
                type="button"
                className="text-xs text-primary-300 hover:text-primary-200"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Use a strong password"
              required
            />
          </div>
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Update Password
          </Button>
        </form>

        <p className="mt-6 text-sm text-gray-400 text-center">
          Back to{" "}
          <Link
            href="/login"
            className="text-primary-400 hover:text-primary-300"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
