"use client";

import { forwardRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { designSystem, getStatusColor, textStyles, spacing, transitions } from '@/lib/design-system';
import { cn } from '@/lib/utils';

// Consistent card component with minimal styling
interface ConsistentCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'interactive' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const ConsistentCard = forwardRef<HTMLDivElement, ConsistentCardProps>(
  ({ children, className, variant = 'default', padding = 'md' }, ref) => {
    const variantClasses = {
      default: designSystem.components.card.base,
      interactive: designSystem.components.card.interactive,
      elevated: `${designSystem.components.card.base} shadow-md`
    };

    const paddingClasses = {
      none: '',
      sm: 'p-3 sm:p-4',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8'
    };

    return (
      <Card
        ref={ref}
        className={cn(
          variantClasses[variant],
          paddingClasses[padding],
          transitions.default,
          className
        )}
      >
        {children}
      </Card>
    );
  }
);
ConsistentCard.displayName = 'ConsistentCard';

// Consistent status badge
interface ConsistentStatusBadgeProps {
  status: string;
  camInvStatus?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ConsistentStatusBadge({
  status,
  camInvStatus,
  size = 'md',
  className
}: ConsistentStatusBadgeProps) {
  const colorVariant = getStatusColor(status, camInvStatus);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const badgeClasses = designSystem.components.badge[colorVariant as keyof typeof designSystem.components.badge];

  return (
    <Badge
      className={cn(
        badgeClasses,
        sizeClasses[size],
        'font-medium border',
        transitions.colors,
        className
      )}
    >
      {status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
    </Badge>
  );
}

// Consistent button with design system styles
interface ConsistentButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const ConsistentButton = forwardRef<HTMLButtonElement, ConsistentButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    disabled = false,
    className,
    onClick,
    type = 'button'
  }, ref) => {
    const variantClasses = designSystem.components.button[variant];
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    return (
      <Button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={cn(
          variantClasses,
          sizeClasses[size],
          'font-medium rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          transitions.default,
          (disabled || loading) && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
        )}
        {children}
      </Button>
    );
  }
);
ConsistentButton.displayName = 'ConsistentButton';

// Consistent section header
interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  actions?: React.ReactNode;
  backButton?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  icon,
  action,
  actions,
  backButton,
  className
}: SectionHeaderProps) {
  // Use actions if provided, otherwise fall back to action for backward compatibility
  const actionElement = actions || action;
  
  return (
    <div className={cn('space-y-4', className)}>
      {backButton && (
        <div className="flex items-center">
          {backButton}
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex-shrink-0">
                {icon}
              </div>
            )}
            <h2 className={textStyles.heading.h2}>{title}</h2>
          </div>
          {description && (
            <p className={textStyles.body.normal}>{description}</p>
          )}
        </div>
        {actionElement && (
          <div className="flex-shrink-0">
            {actionElement}
          </div>
        )}
      </div>
    </div>
  );
}

// Consistent data display card
interface DataCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
}

export function DataCard({ title, value, subtitle, icon, trend, className }: DataCardProps) {
  const getTrendColor = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <ConsistentCard className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className={cn(textStyles.body.small, 'text-gray-600')}>{title}</p>
            <p className="text-xl font-semibold text-gray-900">{value}</p>
            {subtitle && (
              <p className={cn(textStyles.body.small, 'text-gray-500')}>{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="p-2 bg-gray-50 rounded-lg flex-shrink-0">
              {icon}
            </div>
          )}
        </div>

        {trend && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center">
              <span className={cn('text-sm font-medium', getTrendColor(trend.direction))}>
                {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'} {trend.value}%
              </span>
              <span className="ml-2 text-sm text-gray-500">{trend.label}</span>
            </div>
          </div>
        )}
      </CardContent>
    </ConsistentCard>
  );
}

// Consistent empty state
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      {icon && (
        <div className="mx-auto mb-4 text-gray-300">
          {icon}
        </div>
      )}
      <h3 className={cn(textStyles.heading.h3, 'mb-2')}>{title}</h3>
      <p className={cn(textStyles.body.normal, 'mb-6 max-w-md mx-auto')}>{description}</p>
      {action && (
        <ConsistentButton onClick={action.onClick}>
          {action.label}
        </ConsistentButton>
      )}
    </div>
  );
}

// Consistent loading state
interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mb-4" />
      <p className={textStyles.body.normal}>{message}</p>
    </div>
  );
}

// Consistent error state
interface ErrorStateProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function ErrorState({ 
  title = 'Something went wrong', 
  message, 
  action, 
  className 
}: ErrorStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <div className="mx-auto mb-4 w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className={cn(textStyles.heading.h3, 'mb-2')}>{title}</h3>
      <p className={cn(textStyles.body.normal, 'mb-6 max-w-md mx-auto')}>{message}</p>
      {action && (
        <ConsistentButton variant="outline" onClick={action.onClick}>
          {action.label}
        </ConsistentButton>
      )}
    </div>
  );
}

// Consistent form field wrapper
interface FormFieldWrapperProps {
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormFieldWrapper({
  label,
  required = false,
  error,
  help,
  children,
  className
}: FormFieldWrapperProps) {
  return (
    <div className={cn(spacing.form, className)}>
      <label className={cn(
        textStyles.label,
        required && "after:content-['*'] after:text-red-500 after:ml-1"
      )}>
        {label}
      </label>
      {children}
      {error && (
        <p className={textStyles.error}>{error}</p>
      )}
      {help && !error && (
        <p className={textStyles.caption}>{help}</p>
      )}
    </div>
  );
}
