import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "ghost" | "wa" | "danger";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  full = false,
  className = "",
  children,
  ...rest
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 font-bold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed rounded-full whitespace-nowrap";

  const sizes: Record<Size, string> = {
    sm: "px-5 py-2.5 text-[11px] tracking-[0.16em] uppercase",
    md: "px-6 py-3.5 text-[11.5px] tracking-[0.18em] uppercase",
    lg: "px-8 py-4 text-[12px] tracking-[0.2em] uppercase",
  };

  const variants: Record<Variant, string> = {
    primary: "bg-charcoal text-cream hover:opacity-90",
    ghost:
      "bg-transparent text-charcoal border-[1.5px] border-line hover:border-charcoal",
    wa: "bg-wa text-[#053b18] hover:opacity-90",
    danger:
      "bg-transparent text-danger border-[1.5px] border-line hover:border-danger",
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${
        full ? "w-full" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}