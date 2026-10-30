import * as React from "react";
import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

// Pill toggles. The color comes from a --chip-color class set by the caller (category and
// source configs). "On" fills the chip with its color and shows a check mark, so active
// filters stand out and the state never relies on color alone. On the fill the label
// takes the page background color: white on the dark light-mode colors, near-black on the
// light dark-mode ones (5.7:1 at worst). Works for Radix checkboxes and radios
// (data-state) and for plain buttons with aria-pressed.
const chipClassName =
  "group/chip relative inline-flex min-h-8 items-center gap-1.5 rounded-full border border-input bg-background px-3 text-sm whitespace-nowrap text-foreground transition-colors outline-none select-none hover:bg-(--chip-color)/8 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-(--chip-color) data-[state=checked]:bg-(--chip-color) data-[state=checked]:text-background data-[state=checked]:hover:bg-(--chip-color)/90 aria-pressed:border-(--chip-color) aria-pressed:bg-(--chip-color) aria-pressed:text-background aria-pressed:hover:bg-(--chip-color)/90";

// A colored dot when off (a hollow ring for radios, which have no color of their own),
// a check when on. Same box, so the label never shifts.
function ChipMark({ isRadio = false }: { isRadio?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-3.5 shrink-0 place-items-center rounded-full group-aria-pressed/chip:bg-(--chip-color) group-data-[state=checked]/chip:bg-(--chip-color)"
    >
      <span
        className={cn(
          "rounded-full group-aria-pressed/chip:hidden group-data-[state=checked]/chip:hidden",
          isRadio ? "size-3 border border-input" : "size-2 bg-(--chip-color)",
        )}
      />
      <CheckIcon
        strokeWidth={3}
        className="hidden size-2.5 text-background group-aria-pressed/chip:block group-data-[state=checked]/chip:block"
      />
    </span>
  );
}

function ChipCheckbox({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="chip-checkbox"
      className={cn(chipClassName, className)}
      {...props}
    >
      <ChipMark />
      {children}
    </CheckboxPrimitive.Root>
  );
}

function ChipRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="chip-radio-item"
      className={cn(
        chipClassName,
        "[--chip-color:var(--color-primary)]",
        className,
      )}
      {...props}
    >
      <ChipMark isRadio />
      {children}
    </RadioGroupPrimitive.Item>
  );
}

export { ChipCheckbox, ChipMark, ChipRadioItem, chipClassName };
