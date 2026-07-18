import { cn } from "@/lib/utils";

interface NeoCardProps {
  children: React.ReactNode;
  className?: string;
}

export function NeoCard({ children, className }: NeoCardProps) {
  return (
    <div className={cn("neo-card", className)}>
      {children}
    </div>
  );
}
