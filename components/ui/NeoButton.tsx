import { cn } from "@/lib/utils";

interface NeoButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
  disabled?: boolean;
}

export function NeoButton({
  children,
  className,
  onClick,
  type = "button",
  ariaLabel,
  disabled,
}: NeoButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        "neo-button inline-flex items-center justify-center gap-2 font-extrabold disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}
