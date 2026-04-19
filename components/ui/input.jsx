import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-[#64748d] dark:placeholder:text-white/55 selection:bg-primary selection:text-primary-foreground flex h-10 w-full min-w-0 rounded-[4px] border border-[#e5edf5] dark:border-white/20 bg-white dark:bg-[#0d253d] px-3.5 py-2 text-[14px] tracking-normal text-[#061b31] dark:text-white transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:ring-[2px] focus-visible:ring-[#533afd]",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      {...props} />
  );
}

export { Input }
