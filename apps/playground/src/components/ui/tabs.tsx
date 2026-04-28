import * as React from "react";
import { cn } from "../../lib/utils";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

export type TabsProps = React.HTMLAttributes<HTMLDivElement> & TabsContextValue;

export function Tabs({ value, onValueChange, className, ...props }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("ui-tabs", className)} {...props} />
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-tabs-list", className)} {...props} />;
}

export type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
};

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, className, onClick, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    const isActive = context?.value === value;

    return (
      <button
        ref={ref}
        type="button"
        data-state={isActive ? "active" : "inactive"}
        className={cn("ui-tabs-trigger", className)}
        onClick={(event) => {
          context?.onValueChange(value);
          onClick?.(event);
        }}
        {...props}
      />
    );
  }
);

TabsTrigger.displayName = "TabsTrigger";
