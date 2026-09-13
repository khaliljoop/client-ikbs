import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`
        rounded-xl
        border border-ikbs-border
        bg-ikbs-card
        p-6
        shadow-sm
        transition
        ${className}
      `}
    >
      {children}
    </div>
  );
}