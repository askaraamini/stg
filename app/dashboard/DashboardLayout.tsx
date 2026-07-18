import { MobileTopBar } from "./components/MobileTopBar";
import { BottomNavigation } from "./components/BottomNavigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab?: "home" | "missions" | "library" | "profile";
}

export function DashboardLayout({
  children,
  activeTab = "home",
}: DashboardLayoutProps) {
  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <MobileTopBar />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden px-container-margin max-w-md mx-auto md:max-w-6xl md:mx-auto md:px-8">
        {children}
      </main>
      <BottomNavigation activeTab={activeTab} />
    </div>
  );
}
