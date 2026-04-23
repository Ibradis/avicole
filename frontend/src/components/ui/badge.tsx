import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium", {
  variants: {
    variant: {
      default: "bg-primary/10 text-primary",
      secondary: "bg-secondary text-secondary-foreground",
      destructive: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
      warning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
      success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
    }
  },
  defaultVariants: { variant: "default" }
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
