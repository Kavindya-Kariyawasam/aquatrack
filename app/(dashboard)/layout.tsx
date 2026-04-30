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
    <div className="min-h-[var(--content-height)] lg:h-[var(--content-height)] flex lg:overflow-hidden">
      {/* Backdrop for mobile when sidebar is open */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity",
          isSidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden
      />

      <aside
        className={cn(
          // base styles: overlay on small, static on large
          "border-r border-primary-500/20 bg-white/70 dark:bg-dark-card/40 backdrop-blur-xl transition-transform duration-300 overflow-hidden fixed inset-y-0 left-0 z-50 lg:static lg:inset-auto lg:transform-none lg:h-full",
          // when open: visible on mobile and normal width on large
          isSidebarOpen
            ? "translate-x-0 w-[260px] p-3 md:p-4 lg:p-5"
            : "-translate-x-full lg:w-0 lg:p-0 lg:border-r-0",
        )}
      >
        <div className="flex h-full min-h-0 flex-col gap-3 md:gap-4">
          <div className="shrink-0">
            <h2 className="text-xl md:text-2xl font-bold text-gradient">
              AquaTrack
            </h2>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Team Manager
            </p>
            <p className="mt-1 md:mt-2 text-xs md:text-sm text-gray-700 dark:text-gray-200">
              Signed in as <span className="font-semibold">{userName}</span>
            </p>
          </div>

          <nav className="flex-1 min-h-0 space-y-1.5 md:space-y-2 overflow-y-auto overscroll-contain pr-1">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block px-3 py-2 rounded-lg border transition-all text-sm md:text-base",
                  pathname === item.href
                    ? "border-primary-500/40 bg-primary-500/15 text-primary-300"
                    : "border-transparent text-slate-700 dark:text-gray-300 hover:border-primary-500/30 hover:bg-primary-500/10",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="shrink-0 pt-2 md:pt-3 space-y-2">
            <Button
              variant="secondary"
              size="sm"
              className="w-full text-sm md:text-base"
              onClick={toggleTheme}
            >
              {isDarkMode ? "Switch To Light" : "Switch To Dark"}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="w-full text-sm md:text-base"
              onClick={handleLogout}
              isLoading={isLoggingOut}
            >
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <section className="flex-1 min-w-0 p-4 md:p-8 lg:h-full lg:overflow-y-auto lg:min-h-0">
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
