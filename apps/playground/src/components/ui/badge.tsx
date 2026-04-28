import * as React from "react";
import { cn } from "../../lib/utils";

type BadgeVariant = "default" | "success" | "destructive" | "secondary";

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <div className={cn("ui-badge", `ui-badge--${variant}`, className)} {...props} />;
}
