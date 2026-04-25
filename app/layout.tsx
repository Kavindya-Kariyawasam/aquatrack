import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AquaTrack - Swimming Team Management",
  description:
    "Modern swim team management platform for University of Moratuwa",
  keywords: "swimming, team management, progress tracking, university sports",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const year = new Date().getFullYear();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(() => {
              const saved = localStorage.getItem("theme");
              const isDark = saved ? saved === "dark" : true;
              document.documentElement.classList.toggle("dark", isDark);
            })();`}
        </Script>
      </head>
      <body className={`${inter.className} pb-[var(--footer-height)]`}>
        {children}
        <footer className="fixed bottom-0 inset-x-0 z-40 h-[var(--footer-height)] px-4 text-center text-xs text-slate-600 dark:text-gray-400 border-t border-slate-200/70 dark:border-primary-500/20 bg-white/85 dark:bg-dark-card/60 backdrop-blur-sm flex items-center justify-center gap-3">
          <span>© {year} Nexivo Labs. All rights reserved.</span>
          <a
            href="https://www.linkedin.com/company/nexivolabs/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nexivo Labs on LinkedIn"
            className="inline-flex items-center justify-center rounded-full border border-slate-300/80 dark:border-primary-500/40 p-1 text-slate-600 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-300 hover:border-sky-500/60 transition"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M19 3A2 2 0 0 1 21 5v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14ZM8.34 10.75H5.67V19h2.67v-8.25ZM7 6.49a1.55 1.55 0 0 0-1.56 1.56A1.56 1.56 0 1 0 7 6.49Zm12 7.47c0-2.5-1.33-3.66-3.11-3.66a2.7 2.7 0 0 0-2.45 1.35V10.75h-2.67V19h2.67v-4.34c0-1.15.22-2.27 1.64-2.27s1.44 1.33 1.44 2.34V19h2.67v-5.04Z" />
            </svg>
          </a>
        </footer>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#131829",
              color: "#fff",
              border: "1px solid rgba(24, 144, 255, 0.3)",
              borderRadius: "12px",
              backdropFilter: "blur(12px)",
            },
            success: {
              iconTheme: {
                primary: "#00b96b",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ff4d4f",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
