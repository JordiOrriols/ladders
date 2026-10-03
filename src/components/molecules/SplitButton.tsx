import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SplitButtonItem = {
  label: string;
  icon?: React.ReactNode;
  eventId: string;
  onSelect: () => void;
  disabled?: boolean;
};

type Props = {
  label: string;
  icon?: React.ReactNode;
  eventId: string;
  onClick: () => void;
  items: SplitButtonItem[];
  disabled?: boolean;
  menuLabel: string;
  variant?: "default" | "outline";
};

export function SplitButton({
  label,
  icon,
  eventId,
  onClick,
  items,
  disabled = false,
  menuLabel,
  variant = "default",
}: Props) {
  return (
    <div className="inline-flex shrink-0">
      <Button
        eventId={eventId}
        data-testid={`split-button-${eventId}`}
        variant={variant}
        size="sm"
        disabled={disabled}
        onClick={onClick}
        className="rounded-r-none border-r-0"
      >
        {icon}
        {label}
      </Button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            eventId={`${eventId}_menu`}
            data-testid={`split-menu-${eventId}`}
            variant={variant}
            size="icon-sm"
            disabled={items.length === 0}
            aria-label={menuLabel}
            className="rounded-l-none px-1.5"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="z-50 min-w-44 rounded-md border border-slate-200 bg-white p-1 shadow-lg outline-none"
          >
            {items.map((item) => (
              <DropdownMenu.Item
                key={item.eventId}
                data-testid={`split-item-${item.eventId}`}
                {...(item.disabled ? { disabled: true } : {})}
                onSelect={item.onSelect}
                className={cn(
                  "flex cursor-default select-none items-center gap-2 rounded px-3 py-2 text-sm text-slate-700 outline-none",
                  "data-[highlighted]:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                )}
              >
                {item.icon}
                {item.label}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
