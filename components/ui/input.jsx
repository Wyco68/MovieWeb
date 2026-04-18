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
        "file:text-foreground placeholder:text-[rgba(0,0,0,0.48)] selection:bg-primary selection:text-primary-foreground flex h-10 w-full min-w-0 rounded-[11px] border border-black/6 bg-[#fafafc] px-3.5 py-2 text-[14px] tracking-[-0.22px] text-[rgba(0,0,0,0.88)] transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:ring-[2px] focus-visible:ring-[#0071e3]",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      {...props} />
  );
}

export { Input }
