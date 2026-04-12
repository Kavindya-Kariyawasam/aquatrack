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
        <footer className="fixed bottom-0 inset-x-0 z-40 h-[var(--footer-height)] px-4 text-center text-xs text-slate-600 dark:text-gray-400 border-t border-slate-200/70 dark:border-primary-500/20 bg-white/85 dark:bg-dark-card/60 backdrop-blur-sm flex items-center justify-center">
          © {year} Nexivo Labs. All rights reserved.
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
