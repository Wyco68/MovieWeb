import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap border text-[14px] font-normal tracking-[-0.22px] transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[2px] focus-visible:ring-[#0071e3]",
  {
    variants: {
      variant: {
        default:
          "rounded-[980px] border-transparent bg-[#0071e3] text-white hover:bg-[#0077ed]",
        destructive:
          "rounded-[980px] border-transparent bg-destructive text-white hover:bg-destructive/90",
        outline:
          "rounded-[11px] border-black/8 bg-[#fafafc] text-[rgba(0,0,0,0.82)] hover:bg-[#ededf2]",
        secondary:
          "rounded-[980px] border-transparent bg-[#1d1d1f] text-white hover:bg-black",
        ghost:
          "rounded-[11px] border-transparent bg-transparent hover:bg-black/5",
        link: "rounded-[980px] border border-[#0066cc]/20 text-[#0066cc] hover:bg-[#0066cc]/6",
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
