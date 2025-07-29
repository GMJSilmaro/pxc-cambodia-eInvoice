"use client";

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Optimized skeleton loader with minimal animations
interface OptimizedSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export const OptimizedSkeleton = memo(function OptimizedSkeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animate = true
}: OptimizedSkeletonProps) {
  const baseClasses = "bg-gray-200";
  const animationClasses = animate ? "animate-pulse" : "";

  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full aspect-square",
    rectangular: "rounded"
  };

  // Only apply inline styles if explicit dimensions are provided
  const style: React.CSSProperties = {};
  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  if (height !== undefined) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }

  // Use responsive classes when no explicit dimensions are provided
  const responsiveClasses = !width && !height ? 'w-full h-4' : '';

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses,
        responsiveClasses,
        className
      )}
      style={Object.keys(style).length > 0 ? style : undefined}
    />
  );
});

// Optimized card skeleton for consistent loading states
export const CardSkeleton = memo(function CardSkeleton({
  className,
  showHeader = true,
  lines = 3
}: {
  className?: string;
  showHeader?: boolean;
  lines?: number;
}) {
  return (
    <Card className={cn("bg-white border-gray-200", className)}>
      {showHeader && (
        <CardHeader className="pb-3">
          <OptimizedSkeleton className="h-5 w-3/4 mb-2" />
          <OptimizedSkeleton className="h-4 w-1/2" />
        </CardHeader>
      )}
      <CardContent className={showHeader ? "pt-0" : ""}>
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <OptimizedSkeleton
              key={i}
              className={cn(
                "h-4",
                i === lines - 1 ? "w-2/3" : "w-full"
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

// Optimized table skeleton
export const TableSkeleton = memo(function TableSkeleton({
  rows = 5,
  columns = 4,
  className
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <OptimizedSkeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <OptimizedSkeleton
                  key={colIndex}
                  className={cn(
                    "h-4",
                    colIndex === 0 ? "w-24" : "w-16"
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Lazy loading wrapper with intersection observer
interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
}

export function LazyLoad({
  children,
  fallback = <OptimizedSkeleton className="h-32 w-full" />,
  rootMargin = "50px",
  threshold = 0.1,
  className
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, rootMargin, threshold]);

  return (
    <div ref={setRef} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
}

// Debounced search input
interface DebouncedSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}

export function DebouncedSearch({
  value,
  onChange,
  placeholder = "Search...",
  delay = 300,
  className
}: DebouncedSearchProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange, delay]);

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full px-3 py-2 border border-gray-200 rounded-lg",
        "bg-white text-gray-900 placeholder-gray-500",
        "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent",
        "transition-colors duration-200",
        className
      )}
    />
  );
}

// Memoized list item for performance
interface OptimizedListItemProps {
  id: string | number;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const OptimizedListItem = memo(function OptimizedListItem({
  id,
  children,
  className,
  onClick
}: OptimizedListItemProps) {
  return (
    <div
      className={cn(
        "transition-colors duration-200",
        onClick && "cursor-pointer hover:bg-gray-50",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
});

// Virtual scrolling for large lists
interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  );

  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(items.length - 1, visibleEnd + overscan);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1);
  }, [items, startIndex, endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 16) { // More than one frame (60fps)
        console.warn(`${componentName} took ${renderTime.toFixed(2)}ms to render`);
      }
    };
  });
}

// Optimized image loading
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  placeholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!isLoaded && !hasError && (
        <OptimizedSkeleton
          className="absolute inset-0"
          width={width}
          height={height}
        />
      )}
      
      <img
        src={hasError ? placeholder : src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "transition-opacity duration-200",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
}
