"use client";

import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className = "", id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="grid gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-xs uppercase tracking-[0.14em] text-[var(--et-text-faint)]">
          {label}
        </label>
      ) : null}
      <input ref={ref} id={inputId} className={`et-input ${className}`} {...props} />
      {error ? <p className="text-xs text-[var(--et-danger)]">{error}</p> : null}
    </div>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className = "", id, rows = 4, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="grid gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-xs uppercase tracking-[0.14em] text-[var(--et-text-faint)]">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`et-input py-3 ${className}`}
        style={{ minHeight: "unset", height: "auto", resize: "vertical" }}
        {...props}
      />
      {error ? <p className="text-xs text-[var(--et-danger)]">{error}</p> : null}
    </div>
  );
});
