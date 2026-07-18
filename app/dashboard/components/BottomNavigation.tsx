"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { cn } from "@/lib/utils";

type TabKey = "home" | "missions" | "library" | "profile";

interface BottomNavigationProps {
  activeTab?: TabKey;
}

const tabs: { key: TabKey; label: string; icon: string; href: string }[] = [
  { key: "home", label: "Home", icon: "home", href: "/dashboard" },
  { key: "library", label: "Koleksi", icon: "grid_view", href: "/library" },
  { key: "missions", label: "Misi", icon: "task_alt", href: "/misi" },
  { key: "profile", label: "Profil", icon: "account_circle", href: "/profile" },
];

export function BottomNavigation({ activeTab = "home" }: BottomNavigationProps) {
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 w-full z-50 bg-surface-container-lowest border-t border-surface-variant/20">
      <div className="flex justify-around items-center h-20 px-4 pb-safe">
        {tabs.slice(0, 2).map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl px-2 py-1 transition-all active:scale-90 duration-150",
                isActive
                  ? "text-primary font-bold"
                  : "text-on-surface-variant"
              )}
            >
              <MaterialIcon
                name={tab.icon}
                className="mb-1"
                filled={isActive}
              />
              <span className="text-label-sm font-label-sm">{tab.label}</span>
            </Link>
          );
        })}

        {/* FAB Scan Button */}
        <div className="relative flex flex-col items-center">
          <button
            onClick={() => router.push("/scan")}
            className="w-16 h-16 -mt-10 bg-primary rounded-full flex items-center justify-center text-white fab-glow active:scale-95 transition-transform"
          >
            <MaterialIcon
              name="qr_code_scanner"
              className="text-3xl"
              filled
            />
          </button>
          <span className="text-label-sm font-label-sm text-primary mt-1">
            Scan Buku
          </span>
        </div>

        {tabs.slice(2).map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl px-2 py-1 transition-all active:scale-90 duration-150",
                isActive
                  ? "text-primary font-bold"
                  : "text-on-surface-variant"
              )}
            >
              <MaterialIcon
                name={tab.icon}
                className="mb-1"
                filled={isActive}
              />
              <span className="text-label-sm font-label-sm">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
