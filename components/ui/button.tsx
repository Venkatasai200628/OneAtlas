"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-semibold rounded-[12px] transition-all duration-200 cursor-pointer border select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6600]/50 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-[#FF6600] text-white border-transparent hover:bg-[#E65C00] hover:-translate-y-px",
      secondary: "bg-white text-[#111111] border-[#E5E7EB] hover:bg-[#FAFAFA]",
      ghost: "bg-transparent text-[#6B7280] border-transparent hover:bg-[#F5F5EE] hover:text-[#111111]",
      destructive: "bg-red-600 text-white border-transparent hover:bg-red-700",
    };

    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-11 px-5 text-[15px]",
      lg: "h-12 px-6 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
