import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        open: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
        closed: "border-muted-foreground/20 bg-muted text-muted-foreground",
        on_hold: "border-amber-500/20 bg-amber-500/10 text-amber-600",
        pending: "border-muted-foreground/20 bg-muted text-muted-foreground",
        reviewing: "border-primary/20 bg-primary/10 text-primary",
        shortlisted: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
        rejected: "border-destructive/20 bg-destructive/10 text-destructive",
        accepted: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
