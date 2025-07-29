"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "pulse" | "wave";
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

export function EnhancedSkeleton({ 
  className, 
  variant = "default",
  rounded = "md"
}: SkeletonProps) {
  const roundedClasses = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md", 
    lg: "rounded-lg",
    full: "rounded-full"
  };

  const variantClasses = {
    default: "animate-pulse bg-gray-200",
    pulse: "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200",
    wave: "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[wave_1.5s_ease-in-out_infinite]"
  };

  return (
    <div
      className={cn(
        variantClasses[variant],
        roundedClasses[rounded],
        className
      )}
    />
  );
}

// Card skeleton with enhanced animations
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg p-6 shadow-sm", className)}>
      <div className="flex items-start gap-4">
        <EnhancedSkeleton className="h-12 w-12" rounded="lg" variant="wave" />
        <div className="flex-1 space-y-3">
          <EnhancedSkeleton className="h-5 w-3/4" variant="wave" />
          <EnhancedSkeleton className="h-4 w-1/2" variant="wave" />
          <div className="space-y-2">
            <EnhancedSkeleton className="h-3 w-full" variant="wave" />
            <EnhancedSkeleton className="h-3 w-4/5" variant="wave" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Table skeleton with staggered animations
export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <EnhancedSkeleton 
              key={i} 
              className="h-4 w-full" 
              variant="wave"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <EnhancedSkeleton 
                  key={colIndex} 
                  className="h-4 w-full" 
                  variant="wave"
                  style={{ animationDelay: `${(rowIndex * columns + colIndex) * 0.05}s` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Stats card skeleton with enhanced animations
export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <EnhancedSkeleton className="h-4 w-24" variant="wave" />
          <EnhancedSkeleton className="h-8 w-16" variant="wave" />
        </div>
        <EnhancedSkeleton className="h-8 w-8" rounded="lg" variant="wave" />
      </div>
      <div className="mt-4">
        <EnhancedSkeleton className="h-3 w-32" variant="wave" />
      </div>
    </div>
  );
}

// Form skeleton
export function FormSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <EnhancedSkeleton className="h-4 w-24" variant="wave" />
          <EnhancedSkeleton className="h-10 w-full" rounded="md" variant="wave" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <EnhancedSkeleton className="h-10 w-24" rounded="md" variant="wave" />
        <EnhancedSkeleton className="h-10 w-32" rounded="md" variant="wave" />
      </div>
    </div>
  );
}

// Invoice detail skeleton
export function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <EnhancedSkeleton className="h-8 w-64" variant="wave" />
            <EnhancedSkeleton className="h-4 w-32" variant="wave" />
          </div>
          <EnhancedSkeleton className="h-6 w-20" rounded="full" variant="wave" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Content sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
