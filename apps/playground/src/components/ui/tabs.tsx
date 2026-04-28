import {
  type ComponentPropsWithRef,
  createContext,
  type HTMLAttributes,
  useContext,
} from "react";
import { cn } from "../../lib/utils";

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
      <div className={cn("ui-tabs", className)} {...props} />
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-tabs-list", className)} {...props} />;
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
      className={cn("ui-tabs-trigger", className)}
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
