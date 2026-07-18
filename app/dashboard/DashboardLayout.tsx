import { TopAppBar } from "./components/TopAppBar";
import { BottomNavigation } from "./components/BottomNavigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName?: string;
  streakCount?: number;
  activeTab?: "home" | "missions" | "library" | "profile";
}

export function DashboardLayout({
  children,
  userName = "Pelajar",
  streakCount = 0,
  activeTab = "home",
}: DashboardLayoutProps) {
  return (
    <>
      <TopAppBar userName={userName} streakCount={streakCount} />
      <main className="flex-1 overflow-y-auto pb-24 px-0">
        {children}
      </main>
      <BottomNavigation activeTab={activeTab} />
    </>
  );
}
