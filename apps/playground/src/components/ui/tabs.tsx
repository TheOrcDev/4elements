import {
  type ComponentPropsWithRef,
  createContext,
  type HTMLAttributes,
  useContext,
} from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  onValueChange: (value: string) => void;
  value: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps
  extends HTMLAttributes<HTMLDivElement>,
    TabsContextValue {}

export function Tabs({ value, onValueChange, className, ...props }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("w-full", className)} data-slot="tabs" {...props} />
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "grid min-h-10 w-full auto-cols-fr grid-flow-col gap-1 rounded-sm border bg-muted p-1",
        className
      )}
      data-slot="tabs-list"
      {...props}
    />
  );
}

export interface TabsTriggerProps extends ComponentPropsWithRef<"button"> {
  value: string;
}

export function TabsTrigger({
  value,
  className,
  onClick,
  ref,
  ...props
}: TabsTriggerProps) {
  const context = useContext(TabsContext);
  const isActive = context?.value === value;

  return (
    <button
      className={cn(
        "min-w-0 truncate rounded-xs px-1.5 font-semibold text-muted-foreground text-xs outline-none transition-colors hover:text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 data-[state=active]:bg-background data-[state=active]:text-foreground",
        className
      )}
      data-slot="tabs-trigger"
      data-state={isActive ? "active" : "inactive"}
      onClick={(event) => {
        context?.onValueChange(value);
        onClick?.(event);
      }}
      ref={ref}
      type="button"
      {...props}
    />
  );
}
