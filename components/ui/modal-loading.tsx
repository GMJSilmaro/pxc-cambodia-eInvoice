'use client';

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ModalLoadingState = 'loading' | 'success' | 'error' | 'warning';

export interface ProgressStep {
  id: string;
  title: string;
  description: string;
  percentage: number;
  status: 'pending' | 'active' | 'completed' | 'error';
}

export interface ModalLoadingProps {
  isOpen: boolean;
  state: ModalLoadingState;
  title: string;
  description?: string;
  progress?: number;
  showProgress?: boolean;
  steps?: ProgressStep[];
  currentStepId?: string;
  onClose?: () => void;
  onRetry?: () => void;
  autoCloseDelay?: number; // Auto close after success/error (in ms)
  className?: string;
}

const stateConfig = {
  loading: {
    icon: Loader2,
    iconClassName: 'h-8 w-8 text-slate-600 animate-spin',
    titleClassName: 'text-slate-900',
    bgClassName: 'bg-slate-50',
    borderClassName: 'border-slate-200',
  },
  success: {
    icon: CheckCircle,
    iconClassName: 'h-8 w-8 text-green-600',
    titleClassName: 'text-green-900',
    bgClassName: 'bg-green-50',
    borderClassName: 'border-green-200',
  },
  error: {
    icon: XCircle,
    iconClassName: 'h-8 w-8 text-red-600',
    titleClassName: 'text-red-900',
    bgClassName: 'bg-red-50',
    borderClassName: 'border-red-200',
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: 'h-8 w-8 text-yellow-600',
    titleClassName: 'text-yellow-900',
    bgClassName: 'bg-yellow-50',
    borderClassName: 'border-yellow-200',
  },
};

export function ModalLoading({
  isOpen,
  state,
  title,
  description,
  progress,
  showProgress = false,
  steps,
  currentStepId,
  onClose,
  onRetry,
  autoCloseDelay,
  className,
}: ModalLoadingProps) {
  const config = stateConfig[state];
  const Icon = config.icon;

  // Auto close functionality
  React.useEffect(() => {
    if ((state === 'success' || state === 'error') && autoCloseDelay && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [state, autoCloseDelay, onClose]);

  // Prevent closing during loading state
  const handleOpenChange = (open: boolean) => {
    if (!open && state !== 'loading' && onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className={cn(
          'max-w-md mx-auto',
          'focus:outline-none', // Remove default focus outline
          className
        )}
        showCloseButton={state !== 'loading'} // Hide close button during loading
      >
        <div className="flex flex-col items-center text-center p-6">
          {/* Icon and Status Indicator */}
          <div className={cn(
            'flex items-center justify-center w-16 h-16 rounded-full mb-4',
            config.bgClassName,
            config.borderClassName,
            'border-2'
          )}>
            <Icon className={config.iconClassName} />
          </div>

          {/* Title */}
          <h3 className={cn(
            'text-lg font-semibold mb-2',
            config.titleClassName
          )}>
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-sm text-slate-600 mb-4 max-w-sm">
              {description}
            </p>
          )}

          {/* Progress Bar */}
          {showProgress && progress !== undefined && state === 'loading' && (
            <div className="w-full mb-4">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-slate-500 mt-1">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}

          {/* Enhanced Progress Steps */}
          {steps && steps.length > 0 && state === 'loading' && (
            <div className="w-full max-w-md mb-6">
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const isActive = step.id === currentStepId;
                  const isCompleted = step.status === 'completed';
                  const isError = step.status === 'error';

                  return (
                    <div
                      key={step.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg transition-all duration-300',
                        isActive && 'bg-slate-50 border border-slate-200 shadow-sm',
                        isCompleted && 'bg-green-50 border border-green-200',
                        isError && 'bg-red-50 border border-red-200'
                      )}
                    >
                      {/* Step Icon */}
                      <div className={cn(
                        'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-all duration-300',
                        isCompleted && 'bg-green-600 text-white',
                        isActive && 'bg-slate-600 text-white animate-pulse',
                        isError && 'bg-red-600 text-white',
                        !isActive && !isCompleted && !isError && 'bg-slate-200 text-slate-500'
                      )}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : isError ? (
                          <XCircle className="h-4 w-4" />
                        ) : isActive ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          index + 1
                        )}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={cn(
                            'text-sm font-medium transition-colors duration-300',
                            isActive && 'text-slate-900',
                            isCompleted && 'text-green-900',
                            isError && 'text-red-900',
                            !isActive && !isCompleted && !isError && 'text-slate-500'
                          )}>
                            {step.title}
                          </h4>
                          <span className={cn(
                            'text-xs font-medium transition-colors duration-300',
                            isActive && 'text-slate-600',
                            isCompleted && 'text-green-600',
                            isError && 'text-red-600',
                            !isActive && !isCompleted && !isError && 'text-slate-400'
                          )}>
                            {step.percentage}%
                          </span>
                        </div>
                        <p className={cn(
                          'text-xs mt-1 transition-colors duration-300',
                          isActive && 'text-slate-600',
                          isCompleted && 'text-green-600',
                          isError && 'text-red-600',
                          !isActive && !isCompleted && !isError && 'text-slate-400'
                        )}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {(state === 'error' || state === 'warning') && (
            <div className="flex gap-2 mt-2">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-slate-50"
                >
                  Try Again
                </Button>
              )}
              {onClose && (
                <Button
                  onClick={onClose}
                  variant={state === 'error' ? 'destructive' : 'default'}
                  size="sm"
                  className={state === 'error' 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }
                >
                  {state === 'error' ? 'Close' : 'Continue'}
                </Button>
              )}
            </div>
          )}

          {state === 'success' && onClose && (
            <Button
              onClick={onClose}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white mt-2"
            >
              Continue
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for managing modal loading state
export function useModalLoading() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [state, setState] = React.useState<ModalLoadingState>('loading');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState<string | undefined>();
  const [progress, setProgress] = React.useState<number | undefined>();
  const [steps, setSteps] = React.useState<ProgressStep[]>([]);
  const [currentStepId, setCurrentStepId] = React.useState<string | undefined>();

  const showLoading = (title: string, description?: string) => {
    setTitle(title);
    setDescription(description);
    setState('loading');
    setProgress(undefined);
    setIsOpen(true);
  };

  const showSuccess = (title: string, description?: string, autoClose = true) => {
    setTitle(title);
    setDescription(description);
    setState('success');
    if (autoClose) {
      setTimeout(() => setIsOpen(false), 2000);
    }
  };

  const showError = (title: string, description?: string) => {
    setTitle(title);
    setDescription(description);
    setState('error');
  };

  const showWarning = (title: string, description?: string) => {
    setTitle(title);
    setDescription(description);
    setState('warning');
  };

  const updateProgress = (value: number) => {
    setProgress(value);
  };

  const setProgressSteps = (newSteps: ProgressStep[]) => {
    setSteps(newSteps);
    setCurrentStepId(newSteps.find(s => s.status === 'active')?.id);
  };

  const updateStep = (stepId: string, updates: Partial<ProgressStep>) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, ...updates } : step
    ));
    if (updates.status === 'active') {
      setCurrentStepId(stepId);
    }
  };

  const completeStep = (stepId: string) => {
    updateStep(stepId, { status: 'completed' });
  };

  const activateStep = (stepId: string) => {
    updateStep(stepId, { status: 'active' });
  };

  const errorStep = (stepId: string) => {
    updateStep(stepId, { status: 'error' });
  };

  const close = () => {
    setIsOpen(false);
    setSteps([]);
    setCurrentStepId(undefined);
  };

  return {
    isOpen,
    state,
    title,
    description,
    progress,
    steps,
    currentStepId,
    showLoading,
    showSuccess,
    showError,
    showWarning,
    updateProgress,
    setProgressSteps,
    updateStep,
    completeStep,
    activateStep,
    errorStep,
    close,
  };
}
