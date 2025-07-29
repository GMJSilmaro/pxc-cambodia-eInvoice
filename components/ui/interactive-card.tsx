"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InteractiveCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  variant?: 'default' | 'hover-lift' | 'hover-glow' | 'hover-border';
  animation?: 'none' | 'subtle' | 'smooth' | 'bounce';
}

export function InteractiveCard({
  children,
  className,
  onClick,
  href,
  disabled = false,
  variant = 'default',
  animation = 'smooth'
}: InteractiveCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const baseClasses = "transition-all duration-200 ease-in-out";
  
  const variantClasses = {
    default: "hover:shadow-md",
    'hover-lift': "hover:shadow-lg hover:-translate-y-1",
    'hover-glow': "hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-200",
    'hover-border': "hover:border-gray-300 hover:shadow-sm"
  };

  const animationClasses = {
    none: "",
    subtle: "transition-all duration-150",
    smooth: "transition-all duration-200 ease-in-out",
    bounce: "transition-all duration-200 ease-out hover:scale-[1.02]"
  };

  const pressedClasses = isPressed ? "scale-[0.98]" : "";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  const cardClasses = cn(
    baseClasses,
    variantClasses[variant],
    animationClasses[animation],
    pressedClasses,
    disabled ? disabledClasses : "cursor-pointer",
    className
  );

  const handleMouseDown = () => {
    if (!disabled) setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleClick = () => {
    if (disabled) return;
    
    if (href) {
      window.location.href = href;
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <Card
      className={cardClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
    >
      {children}
    </Card>
  );
}

// Enhanced button with micro-interactions
interface InteractiveButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: React.ReactNode;
  loadingText?: string;
}

export function InteractiveButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  className,
  icon,
  loadingText
}: InteractiveButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500 active:bg-gray-900",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 active:bg-gray-300",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500 active:bg-gray-100",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200"
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm rounded-md",
    md: "px-4 py-2 text-sm rounded-md",
    lg: "px-6 py-3 text-base rounded-lg"
  };

  const pressedClasses = isPressed && !disabled && !loading ? "scale-[0.98]" : "";
  const disabledClasses = (disabled || loading) ? "opacity-50 cursor-not-allowed" : "";

  const buttonClasses = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    pressedClasses,
    disabledClasses,
    className
  );

  const handleMouseDown = () => {
    if (!disabled && !loading) setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleClick = () => {
    if (disabled || loading) return;
    onClick?.();
  };

  return (
    <button
      className={buttonClasses}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setIsPressed(false)}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
          {loadingText || 'Loading...'}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}

// Status indicator with pulse animation
interface StatusIndicatorProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'loading';
  text?: string;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusIndicator({ 
  status, 
  text, 
  pulse = false,
  size = 'md' 
}: StatusIndicatorProps) {
  const statusConfig = {
    success: { color: 'bg-green-500', textColor: 'text-green-700' },
    error: { color: 'bg-red-500', textColor: 'text-red-700' },
    warning: { color: 'bg-yellow-500', textColor: 'text-yellow-700' },
    info: { color: 'bg-blue-500', textColor: 'text-blue-700' },
    loading: { color: 'bg-gray-400', textColor: 'text-gray-700' }
  };

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const config = statusConfig[status];
  const pulseClass = pulse ? 'animate-pulse' : '';
  const loadingClass = status === 'loading' ? 'animate-pulse' : '';

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'rounded-full',
          config.color,
          sizeClasses[size],
          pulseClass,
          loadingClass
        )}
      />
      {text && (
        <span className={cn(config.textColor, textSizeClasses[size], 'font-medium')}>
          {text}
        </span>
      )}
    </div>
  );
}
