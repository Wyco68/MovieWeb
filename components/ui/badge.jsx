import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-[4px] border px-2 py-0.5 text-[11px] font-normal tracking-normal w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-[2px] focus-visible:ring-[#533afd] transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#533afd] text-white [a&]:hover:bg-[#4434d4]",
        secondary:
          "border-[#e5edf5] bg-white text-[#273951] [a&]:hover:bg-[#f6f9fc] dark:border-white/20 dark:bg-[#0d253d] dark:text-white dark:[a&]:hover:bg-white/10",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90",
        outline:
          "border-[#b9b9f9] text-[#533afd] [a&]:hover:bg-[#533afd]/5 dark:border-white/30 dark:text-white dark:[a&]:hover:bg-white/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props} />
  );
}

export { Badge, badgeVariants }
