import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#111111] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full h-11 px-4 rounded-[12px] border border-[#E5E7EB] bg-white text-[#111111] text-sm placeholder:text-[#9CA3AF] transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#F5F5EE]",
              error && "border-red-400 focus:ring-red-400/20 focus:border-red-400",
              icon && "pl-10",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
