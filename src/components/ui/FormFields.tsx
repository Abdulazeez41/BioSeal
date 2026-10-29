"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, UploadCloud } from "lucide-react";

interface FieldWrapperProps {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FieldWrapper({ label, error, description, required, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-label uppercase tracking-wider text-ink-secondary">
        {label} {required && <span className="text-status-critical">*</span>}
      </label>
      {children}
      {description && !error && <p className="text-xs text-ink-muted leading-normal">{description}</p>}
      {error && (
        <p className="flex items-center gap-1 text-xs text-status-critical font-medium">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  description?: string;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, description, required, className, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error} description={description} required={required}>
        <input
          ref={ref}
          className={cn(
            "w-full rounded-input border border-border bg-surface px-3.5 py-2.5 text-small text-ink-primary placeholder:text-ink-muted transition-colors",
            "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30",
            "disabled:bg-surface-soft disabled:text-ink-muted disabled:cursor-not-allowed",
            error && "border-status-critical focus:border-status-critical",
            className
          )}
          {...props}
        />
      </FieldWrapper>
    );
  }
);
TextField.displayName = "TextField";

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  description?: string;
  options: Array<{ value: string; label: string; hint?: string }>;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, description, required, options, className, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error} description={description} required={required}>
        <select
          ref={ref}
          className={cn(
            "w-full rounded-input border border-border bg-surface px-3.5 py-2.5 text-small text-ink-primary transition-colors cursor-pointer",
            "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30",
            "disabled:bg-surface-soft disabled:text-ink-muted disabled:cursor-not-allowed",
            error && "border-status-critical focus:border-status-critical",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} {opt.hint ? `(${opt.hint})` : ""}
            </option>
          ))}
        </select>
      </FieldWrapper>
    );
  }
);
SelectField.displayName = "SelectField";

interface DateFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  description?: string;
}

export const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(
  ({ label, error, description, required, className, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error} description={description} required={required}>
        <input
          type="datetime-local"
          ref={ref}
          className={cn(
            "w-full rounded-input border border-border bg-surface px-3.5 py-2.5 text-small text-ink-primary transition-colors",
            "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30",
            "disabled:bg-surface-soft disabled:text-ink-muted disabled:cursor-not-allowed",
            error && "border-status-critical focus:border-status-critical",
            className
          )}
          {...props}
        />
      </FieldWrapper>
    );
  }
);
DateField.displayName = "DateField";
