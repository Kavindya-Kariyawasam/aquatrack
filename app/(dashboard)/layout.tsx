"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Menu, PanelLeftClose } from "lucide-react";
import Button from "@/components/ui/Button";
import { clearAuthMeCache, getAuthMeUser } from "@/lib/authMeClient";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/progress", label: "Progress" },
  { href: "/training", label: "Training" },
  { href: "/attendance", label: "Attendance" },
  { href: "/stats", label: "Stats" },
  { href: "/past-results", label: "Past Results" },
  { href: "/announcements", label: "Announcements" },
  { href: "/team", label: "Team" },
  { href: "/admin", label: "Admin" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [role, setRole] = useState<"swimmer" | "coach" | "admin">("swimmer");
  const [userName, setUserName] = useState("Swimmer");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const user = await getAuthMeUser();
        if (user?.role) {
          setRole(user.role);
          setUserName(user.name || "Swimmer");
        }
      } catch {
        // no-op
      }
    };

    void loadRole();
  }, []);

  useEffect(() => {
    const darkEnabled = document.documentElement.classList.contains("dark");
    setIsDarkMode(darkEnabled);
  }, []);

  const visibleNavItems = useMemo(() => {
    if (role === "admin") return navItems;
    if (role === "coach")
      return navItems.filter((item) => item.href !== "/admin");

    return navItems.filter(
      (item) => item.href !== "/admin" && item.href !== "/team",
    );
  }, [role]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      clearAuthMeCache();
      toast.success("Logged out");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Unable to logout. Try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleTheme = () => {
    const nextIsDark = !isDarkMode;
    document.documentElement.classList.toggle("dark", nextIsDark);
    localStorage.setItem("theme", nextIsDark ? "dark" : "light");
    setIsDarkMode(nextIsDark);
  };

  return (
    <div className="min-h-[var(--content-height)] flex">
      <aside
        className={cn(
          "shrink-0 border-r border-primary-500/20 bg-white/70 dark:bg-dark-card/40 backdrop-blur-xl transition-all duration-300 overflow-hidden",
          isSidebarOpen ? "w-[260px] p-4 lg:p-6" : "w-0 p-0 border-r-0",
        )}
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gradient">AquaTrack</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Team Manager
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-200 mt-2">
            Signed in as <span className="font-semibold">{userName}</span>
          </p>
        </div>

        <nav className="space-y-2 mb-6">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block px-3 py-2 rounded-lg border transition-all",
                pathname === item.href
                  ? "border-primary-500/40 bg-primary-500/15 text-primary-300"
                  : "border-transparent text-slate-700 dark:text-gray-300 hover:border-primary-500/30 hover:bg-primary-500/10",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Button variant="secondary" className="w-full" onClick={toggleTheme}>
          {isDarkMode ? "Switch To Light" : "Switch To Dark"}
        </Button>

        <Button
          variant="secondary"
          className="w-full mt-2"
          onClick={handleLogout}
          isLoading={isLoggingOut}
        >
          Logout
        </Button>
      </aside>

      <section className="flex-1 min-w-0 p-4 md:p-8">
        <div className="mb-4 flex items-center">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-primary-500/30 bg-white/70 dark:bg-dark-card/60 text-slate-700 dark:text-gray-200 hover:border-primary-500/60 hover:bg-primary-500/10 transition"
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={isSidebarOpen ? "Collapse menu" : "Expand menu"}
          >
            {isSidebarOpen ? <PanelLeftClose size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
