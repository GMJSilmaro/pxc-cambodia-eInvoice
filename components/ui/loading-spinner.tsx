"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
  variant?: "default" | "subtle" | "overlay";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8",
  xl: "h-12 w-12"
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg", 
  xl: "text-xl"
};

export function LoadingSpinner({ 
  size = "md", 
  className, 
  text,
  variant = "default" 
}: LoadingSpinnerProps) {
  const baseClasses = "animate-spin";
  const spinnerClasses = cn(baseClasses, sizeClasses[size], className);

  if (variant === "overlay") {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col items-center gap-3">
          <Loader2 className={spinnerClasses} />
          {text && (
            <p className={cn("text-gray-600 font-medium", textSizeClasses[size])}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (variant === "subtle") {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className={cn(spinnerClasses, "text-gray-400")} />
        {text && (
          <span className={cn("text-gray-500", textSizeClasses[size])}>
            {text}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Loader2 className={spinnerClasses} />
      {text && (
        <span className={cn("text-gray-700 font-medium", textSizeClasses[size])}>
          {text}
        </span>
      )}
    </div>
  );
}

// Progress indicator for multi-step operations
interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function ProgressIndicator({ steps, currentStep, className }: ProgressIndicatorProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-300",
                index < currentStep
                  ? "bg-green-500 text-white"
                  : index === currentStep
                  ? "bg-blue-500 text-white animate-pulse"
                  : "bg-gray-200 text-gray-500"
              )}
            >
              {index < currentStep ? "✓" : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-1 w-16 mx-2 transition-all duration-300",
                  index < currentStep ? "bg-green-500" : "bg-gray-200"
                )}
              />
            )}
          </div>
        ))}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">{steps[currentStep]}</p>
      </div>
    </div>
  );
}

// Pulse animation for loading states
export function PulseLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-2", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: "1s"
          }}
        />
      ))}
    </div>
  );
}
