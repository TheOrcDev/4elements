import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

type BadgeVariant = "default" | "success" | "destructive" | "secondary";

export interface BadgeProps extends ComponentProps<"div"> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn("ui-badge", `ui-badge--${variant}`, className)}
      {...props}
    />
  );
}
