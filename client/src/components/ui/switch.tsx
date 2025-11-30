import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  activeLabel?: string;
  activeColor?: 'amber' | 'burgundy' | 'default';
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, activeLabel, activeColor = 'default', ...props }, ref) => {
  const hasLabel = !!activeLabel;
  
  const getActiveColorClass = () => {
    if (!hasLabel) return "data-[state=checked]:bg-gray-900 dark:data-[state=checked]:bg-white";
    switch (activeColor) {
      case 'amber':
        return "data-[state=checked]:bg-amber-500";
      case 'burgundy':
        return "data-[state=checked]:bg-[#800020]";
      default:
        return "data-[state=checked]:bg-gray-900 dark:data-[state=checked]:bg-white";
    }
  };
  
  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-0 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        hasLabel ? "h-5 w-10 relative" : "h-5 w-9",
        "data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700",
        getActiveColorClass(),
        className
      )}
      {...props}
      ref={ref}
    >
      {hasLabel && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white transition-opacity duration-200 data-[state=unchecked]:opacity-0 data-[state=checked]:opacity-100" data-state={props.checked ? "checked" : "unchecked"}>
          {activeLabel}
        </span>
      )}
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 data-[state=unchecked]:translate-x-0.5",
          hasLabel 
            ? "data-[state=checked]:translate-x-[22px]"
            : "data-[state=checked]:translate-x-[18px] dark:data-[state=checked]:bg-gray-900"
        )}
      />
    </SwitchPrimitives.Root>
  );
})
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
