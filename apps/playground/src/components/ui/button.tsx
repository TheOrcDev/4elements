import type { ComponentPropsWithRef } from "react";
import { cn } from "../../lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost";
type ButtonSize = "default" | "sm" | "icon";

export interface ButtonProps extends ComponentPropsWithRef<"button"> {
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export function Button({
  className,
  ref,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "ui-button",
        `ui-button--${variant}`,
        `ui-button--${size}`,
        className
      )}
      ref={ref}
      {...props}
    />
  );
}
