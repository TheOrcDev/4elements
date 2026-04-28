import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-7 items-center justify-center whitespace-nowrap rounded-sm px-2.5 font-semibold text-xs transition-colors",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive/10 text-destructive",
        secondary: "bg-secondary text-secondary-foreground",
      },
    },
  }
);

export interface BadgeProps
  extends ComponentProps<"div">,
    VariantProps<typeof badgeVariants> {}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, className }))}
      data-slot="badge"
      {...props}
    />
  );
}
