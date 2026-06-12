"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--tenant-primary)] px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(0,87,255,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}
