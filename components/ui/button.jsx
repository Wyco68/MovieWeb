import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap border text-[14px] font-normal tracking-normal transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[2px] focus-visible:ring-[#533afd]",
  {
    variants: {
      variant: {
        default:
          "rounded-[4px] border-transparent bg-[#533afd] text-white hover:bg-[#4434d4]",
        destructive:
          "rounded-[4px] border-transparent bg-destructive text-white hover:bg-destructive/90",
        outline:
          "rounded-[4px] border-[#b9b9f9] bg-transparent text-[#533afd] hover:bg-[#533afd]/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10",
        secondary:
          "rounded-[4px] border-transparent bg-[#061b31] text-white hover:bg-[#0d253d] dark:bg-white dark:text-[#061b31] dark:hover:bg-white/90",
        ghost:
          "rounded-[4px] border-transparent bg-transparent hover:bg-[#533afd]/6 dark:hover:bg-white/10",
        link: "rounded-[4px] border border-[#b9b9f9] text-[#533afd] hover:bg-[#533afd]/8 dark:border-white/30 dark:text-white dark:hover:bg-white/10",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 px-7 has-[>svg]:px-5",
        icon: "size-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
