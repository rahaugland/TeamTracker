import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold transition-all shadow-sm",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:shadow-md hover:scale-105",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:shadow-md hover:scale-105",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:shadow-md hover:scale-105",
        outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md hover:scale-105",
        success: "border-transparent status-success hover:shadow-md hover:scale-105",
        warning: "border-transparent status-warning hover:shadow-md hover:scale-105",
        info: "border-transparent status-info hover:shadow-md hover:scale-105",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
