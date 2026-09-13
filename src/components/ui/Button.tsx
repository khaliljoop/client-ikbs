import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "success" | "outline";
}

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-ikbs-primary text-white hover:bg-ikbs-primary-dark",

    success:
      "bg-ikbs-success text-white hover:opacity-90",

    outline:
      "border border-ikbs-primary text-ikbs-primary hover:bg-ikbs-primary hover:text-white",
  };

  return (
    <button
      className={`
        inline-flex
        items-center
        justify-center
        rounded-lg
        px-4
        py-2
        text-sm
        font-semibold
        transition
        focus:outline-none
        focus:ring-2
        focus:ring-ikbs-primary/30
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}