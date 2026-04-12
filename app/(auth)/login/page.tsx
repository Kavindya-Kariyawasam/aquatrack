"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Login failed");
        return;
      }

      toast.success("Login successful");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-[var(--content-height)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md" hover>
        <p className="mb-3 text-xs text-gray-400">
          <Link href="/" className="text-primary-400 hover:text-primary-300">
            ← Back to landing page
          </Link>
        </p>
        <h1 className="section-heading mb-2">Welcome Back</h1>
        <p className="text-gray-400 mb-6">Sign in to AquaTrack</p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@uom.lk"
            required
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Password
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
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <p className="mt-3 text-sm text-center">
          <Link
            href="/forgot-password"
            className="text-primary-400 hover:text-primary-300"
          >
            Forgot password?
          </Link>
        </p>

        <p className="mt-6 text-sm text-gray-400 text-center">
          New to AquaTrack?{" "}
          <Link
            href="/register"
            className="text-primary-400 hover:text-primary-300"
          >
            Create account
          </Link>
        </p>
      </Card>
    </main>
  );
}
