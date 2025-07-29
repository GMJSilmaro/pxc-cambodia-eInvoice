"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Responsive breakpoint hooks
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setBreakpoint('sm');
      else if (width < 768) setBreakpoint('md');
      else if (width < 1024) setBreakpoint('lg');
      else if (width < 1280) setBreakpoint('xl');
      else setBreakpoint('2xl');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

export function useIsMobile() {
  const breakpoint = useBreakpoint();
  return breakpoint === 'sm' || breakpoint === 'md';
}

// Responsive container component
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'xl',
  padding = 'md'
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-7xl',
    '2xl': 'max-w-none',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-2 py-2 sm:px-4 sm:py-4',
    md: 'px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8',
    lg: 'px-6 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-12'
  };

  return (
    <div className={cn(
      'mx-auto w-full',
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}

// Responsive grid component
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
}

export function ResponsiveGrid({
  children,
  className,
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'md'
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  const gridCols = [
    cols.sm && `grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`
  ].filter(Boolean).join(' ');

  return (
    <div className={cn(
      'grid',
      gridCols,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

// Mobile-optimized card stack
interface MobileCardStackProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'tight' | 'normal' | 'loose';
}

export function MobileCardStack({
  children,
  className,
  spacing = 'normal'
}: MobileCardStackProps) {
  const isMobile = useIsMobile();

  const spacingClasses = {
    tight: 'space-y-2',
    normal: 'space-y-4',
    loose: 'space-y-6'
  };

  if (isMobile) {
    return (
      <div className={cn(
        'flex flex-col',
        spacingClasses[spacing],
        className
      )}>
        {children}
      </div>
    );
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
}

// Responsive table wrapper
interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  mobileLayout?: 'stack' | 'scroll' | 'cards';
}

export function ResponsiveTable({
  children,
  className,
  mobileLayout = 'scroll'
}: ResponsiveTableProps) {
  const isMobile = useIsMobile();

  if (isMobile && mobileLayout === 'scroll') {
    return (
      <div className={cn(
        'overflow-x-auto -mx-4 px-4',
        'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100',
        className
      )}>
        <div className="min-w-full">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
}

// Responsive sidebar layout
interface ResponsiveSidebarLayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  className?: string;
  sidebarWidth?: 'sm' | 'md' | 'lg';
  collapsible?: boolean;
}

export function ResponsiveSidebarLayout({
  sidebar,
  main,
  className,
  sidebarWidth = 'md',
  collapsible = true
}: ResponsiveSidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const sidebarWidthClasses = {
    sm: 'lg:w-64',
    md: 'lg:w-80',
    lg: 'lg:w-96'
  };

  if (isMobile) {
    return (
      <div className={cn('flex flex-col space-y-6', className)}>
        {collapsible && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden bg-white border border-gray-200 rounded-lg p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {sidebarOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
        )}
        
        {(!collapsible || sidebarOpen) && (
          <div className="lg:hidden">
            {sidebar}
          </div>
        )}
        
        <div className="flex-1">
          {main}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-8', className)}>
      <aside className={cn('flex-shrink-0', sidebarWidthClasses[sidebarWidth])}>
        {sidebar}
      </aside>
      <main className="flex-1 min-w-0">
        {main}
      </main>
    </div>
  );
}

// Responsive modal/dialog
interface ResponsiveModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function ResponsiveModal({
  children,
  isOpen,
  onClose,
  title,
  className,
  size = 'md'
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/20 transition-opacity"
          onClick={onClose}
        />
        
        <div className={cn(
          'relative bg-white rounded-lg shadow-lg w-full',
          isMobile ? 'max-w-full mx-4' : sizeClasses[size],
          'max-h-[90vh] overflow-y-auto',
          className
        )}>
          {title && (
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </div>
          )}
          
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Responsive text sizing
export const responsiveText = {
  xs: 'text-xs sm:text-sm',
  sm: 'text-sm sm:text-base',
  base: 'text-base sm:text-lg',
  lg: 'text-lg sm:text-xl',
  xl: 'text-xl sm:text-2xl',
  '2xl': 'text-2xl sm:text-3xl',
  '3xl': 'text-3xl sm:text-4xl'
};

// Responsive spacing utilities
export const responsiveSpacing = {
  xs: 'space-y-2 sm:space-y-3',
  sm: 'space-y-3 sm:space-y-4',
  md: 'space-y-4 sm:space-y-6',
  lg: 'space-y-6 sm:space-y-8',
  xl: 'space-y-8 sm:space-y-12'
};
