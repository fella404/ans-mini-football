import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const ToolbarSelect = ({
  items,
  value,
  onChange,
  ariaLabel,
  placeholder,
  id,
  triggerClassName,
  popupClassName,
}) => (
  <Select.Root items={items} value={value} onValueChange={onChange}>
    <Select.Trigger
      id={id}
      aria-label={ariaLabel}
      className={cn(
        "flex h-8 items-center justify-between gap-2 border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30",
        triggerClassName,
      )}
    >
      <Select.Value>
        {(selected) =>
          items.find((item) => item.value === selected)?.label ?? placeholder
        }
      </Select.Value>
      <Select.Icon>
        <ChevronDown
          aria-hidden="true"
          className="size-3.5 shrink-0 text-muted-foreground"
        />
      </Select.Icon>
    </Select.Trigger>

    <Select.Portal>
      <Select.Positioner
        sideOffset={4}
        alignItemWithTrigger={false}
        className="z-50 outline-none"
      >
        <Select.Popup
          className={cn(
            "border border-border bg-popover p-1 text-popover-foreground shadow-md",
            popupClassName,
          )}
        >
          <Select.List>
            {items.map((item) => (
              <Select.Item
                key={item.value}
                value={item.value}
                className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-xs outline-none select-none data-highlighted:bg-muted"
              >
                {item.label}
                <Select.ItemIndicator className="ml-auto">
                  <Check aria-hidden="true" className="size-3.5" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.List>
        </Select.Popup>
      </Select.Positioner>
    </Select.Portal>
  </Select.Root>
);

export default ToolbarSelect;
