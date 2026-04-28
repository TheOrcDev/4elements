import type { ComponentPropsWithRef } from "react";
import { cn } from "../../lib/utils";

export type TextareaProps = ComponentPropsWithRef<"textarea">;

export function Textarea({ className, ref, ...props }: TextareaProps) {
  return (
    <textarea className={cn("ui-textarea", className)} ref={ref} {...props} />
  );
}
