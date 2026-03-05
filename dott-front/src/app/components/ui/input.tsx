import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-all duration-150 ease-standard placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input",
        error: "border-danger text-foreground",
      },
      size: {
        sm: "h-8",
        md: "h-10",
        lg: "h-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  label?: string;
  helpText?: string;
  errorText?: string;
}

export function Input({
  className,
  label,
  helpText,
  errorText,
  variant,
  size,
  id,
  ...props
}: InputProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const hasError = Boolean(errorText) || variant === "error";
  const helperId = `${inputId}-help`;

  return (
    <div className="w-full space-y-1.5">
      {label ? (
        <label className="text-sm font-medium text-foreground" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(inputVariants({ variant: hasError ? "error" : variant, size }), className)}
        aria-invalid={hasError}
        aria-describedby={helpText || errorText ? helperId : undefined}
        {...props}
      />
      {errorText ? (
        <p id={helperId} className="text-sm text-danger">
          {errorText}
        </p>
      ) : helpText ? (
        <p id={helperId} className="text-sm text-muted-foreground">
          {helpText}
        </p>
      ) : null}
    </div>
  );
}
