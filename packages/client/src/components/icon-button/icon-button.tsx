import { type ReactNode, type ButtonHTMLAttributes } from "react";

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  "aria-haspopup"?: "dialog" | "menu" | "listbox" | "tree" | "grid" | boolean;
}

export const IconButton = ({
  children,
  className = "",
  "aria-haspopup": ariaHaspopup = "dialog",
  ...props
}: IconButtonProps) => {
  const baseClasses =
    "rounded-full border border-[var(--border-main)] inline-flex items-center justify-center gap-1 clickable cursor-pointer text-xs text-[var(--text-secondary)] hover:bg-[var(--fill-tsp-gray-main)] w-8 h-8 p-0 data-[popover-trigger]:bg-[var(--fill-tsp-gray-main)] shrink-0";

  return (
    <button
      className={`${baseClasses} ${className}`.trim()}
      aria-haspopup={ariaHaspopup}
      {...props}
    >
      {children}
    </button>
  );
};
