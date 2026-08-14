import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary/95 to-primary text-primary-foreground shadow-[0_1px_0_0_color-mix(in_oklch,white_28%,transparent)_inset,0_10px_30px_-12px_color-mix(in_oklch,var(--primary)_75%,transparent)] hover:brightness-110 hover:-translate-y-[1px]",
        destructive:
          "bg-gradient-to-b from-destructive/95 to-destructive text-destructive-foreground shadow-[0_1px_0_0_color-mix(in_oklch,white_22%,transparent)_inset,0_10px_28px_-14px_color-mix(in_oklch,var(--destructive)_70%,transparent)] hover:brightness-110",
        outline:
          "glass-interactive text-foreground hover:-translate-y-[1px] hover:border-primary/35",
        secondary:
          "glass-interactive bg-secondary/50 text-secondary-foreground hover:-translate-y-[1px]",
        ghost:
          "text-muted-foreground hover:bg-foreground/8 hover:text-foreground hover:backdrop-blur-md",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
