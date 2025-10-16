import * as React from "react";
import { cn } from "@/lib/utils/helpers";

interface ErrorMessageProps {
  title?: string;
  message: string;
  className?: string;
  variant?: "default" | "destructive" | "warning";
}

export function ErrorMessage({
  title,
  message,
  className,
  variant = "destructive",
}: ErrorMessageProps) {
  const variantStyles = {
    default: "bg-primary-100 border-primary-300 text-primary-900",
    destructive: "bg-red-50 border-red-200 text-red-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
  };

  const iconColor = {
    default: "text-primary-600",
    destructive: "text-red-600",
    warning: "text-amber-600",
  };

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border p-4",
        variantStyles[variant],
        className
      )}
      role="alert"
    >
      <div className={cn("flex-shrink-0", iconColor[variant])}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
      </div>
      <div className="flex-1">
        {title && <h3 className="mb-1 font-medium">{title}</h3>}
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

interface InlineErrorProps {
  message: string;
  className?: string;
}

export function InlineError({ message, className }: InlineErrorProps) {
  return (
    <p className={cn("text-sm text-red-600 mt-1", className)} role="alert">
      {message}
    </p>
  );
}

interface ErrorPageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

export function ErrorPage({
  title = "Something went wrong",
  message,
  onRetry,
  retryText = "Try again",
}: ErrorPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-600"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" x2="9" y1="9" y2="15" />
              <line x1="9" x2="15" y1="9" y2="15" />
            </svg>
          </div>
        </div>
        <h1 className="mb-3 text-2xl font-bold text-primary-900">{title}</h1>
        <p className="mb-6 text-primary-600">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-md bg-primary-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
          >
            {retryText}
          </button>
        )}
      </div>
    </div>
  );
}

interface FieldErrorProps {
  error?: string;
}

export function FieldError({ error }: FieldErrorProps) {
  if (!error) return null;
  return <InlineError message={error} />;
}
