"use client";

import { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpTooltip } from '@/components/ui/enhanced-tooltip';
import { ariaLabels, keyboardHandlers, focusUtils } from '@/lib/accessibility-utils';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'tel' | 'url' | 'password' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  helpText?: string;
  helpTitle?: string;
  helpExample?: string;
  className?: string;
  autoComplete?: string;
  maxLength?: number;
  pattern?: string;
  rows?: number; // for textarea
}

export function AccessibleFormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder,
  error,
  helpText,
  helpTitle,
  helpExample,
  className,
  autoComplete,
  maxLength,
  pattern,
  rows = 3
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  
  const fieldId = `field-${id}`;
  const errorId = `error-${id}`;
  const helpId = `help-${id}`;
  
  const hasError = !!error;
  const showHelp = !!(helpText || helpTitle);

  const commonProps = {
    id: fieldId,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
      onChange(e.target.value),
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    disabled,
    placeholder,
    autoComplete,
    maxLength,
    pattern,
    required,
    'aria-invalid': hasError,
    'aria-describedby': [
      error ? errorId : '',
      helpText ? helpId : ''
    ].filter(Boolean).join(' ') || undefined,
    'aria-label': ariaLabels.formField(label, required),
    className: cn(
      'transition-all duration-200',
      hasError && 'border-red-300 focus:border-red-500 focus:ring-red-500',
      isFocused && !hasError && 'border-blue-300 focus:border-blue-500 focus:ring-blue-500',
      className
    )
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label 
          htmlFor={fieldId}
          className={cn(
            'text-sm font-medium text-gray-700',
            required && 'after:content-["*"] after:text-red-500 after:ml-1',
            disabled && 'text-gray-400'
          )}
        >
          {label}
        </Label>
        {showHelp && (
          <HelpTooltip
            title={helpTitle || label}
            description={helpText || ''}
            example={helpExample}
          />
        )}
      </div>

      {type === 'textarea' ? (
        <Textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          rows={rows}
          {...commonProps}
        />
      ) : (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type}
          {...commonProps}
        />
      )}

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription id={errorId} role="alert">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {helpText && !error && (
        <p id={helpId} className="text-xs text-gray-500">
          <Info className="h-3 w-3 inline mr-1" aria-hidden="true" />
          {helpText}
        </p>
      )}
    </div>
  );
}

// Accessible form container with keyboard navigation
interface AccessibleFormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
  title?: string;
  description?: string;
  errors?: Record<string, string>;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
}

export function AccessibleForm({
  children,
  onSubmit,
  className,
  title,
  description,
  errors,
  isSubmitting = false,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel
}: AccessibleFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [focusedFieldIndex, setFocusedFieldIndex] = useState(-1);

  useEffect(() => {
    if (formRef.current) {
      const cleanup = focusUtils.trapFocus(formRef.current);
      return cleanup;
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!formRef.current) return;

    const formFields = Array.from(
      formRef.current.querySelectorAll('input, textarea, select, button')
    ) as HTMLElement[];

    keyboardHandlers.listNavigation(
      e,
      focusedFieldIndex,
      formFields.length,
      (newIndex) => {
        setFocusedFieldIndex(newIndex);
        formFields[newIndex]?.focus();
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubmitting) {
      onSubmit(e);
    }
  };

  const hasErrors = errors && Object.keys(errors).length > 0;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className={cn('space-y-6', className)}
      noValidate
      aria-label={title}
      aria-describedby={description ? 'form-description' : undefined}
    >
      {title && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && (
            <p id="form-description" className="text-sm text-gray-600">
              {description}
            </p>
          )}
        </div>
      )}

      {hasErrors && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Please correct the following errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field} className="text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {children}
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
          >
            {cancelLabel}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || hasErrors}
          className="bg-gray-900 hover:bg-gray-800 text-white"
          aria-describedby={isSubmitting ? 'submit-status' : undefined}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
              Submitting...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>

      {isSubmitting && (
        <div id="submit-status" className="sr-only" aria-live="polite">
          Form is being submitted, please wait.
        </div>
      )}
    </form>
  );
}

// Form validation utilities
export const formValidation = {
  required: (value: string, fieldName: string) => 
    !value.trim() ? `${fieldName} is required` : '',

  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return value && !emailRegex.test(value) ? 'Please enter a valid email address' : '';
  },

  minLength: (value: string, min: number, fieldName: string) =>
    value && value.length < min ? `${fieldName} must be at least ${min} characters` : '',

  maxLength: (value: string, max: number, fieldName: string) =>
    value && value.length > max ? `${fieldName} must be no more than ${max} characters` : '',

  pattern: (value: string, pattern: RegExp, message: string) =>
    value && !pattern.test(value) ? message : '',

  number: (value: string, fieldName: string) => {
    const num = parseFloat(value);
    return value && (isNaN(num) || !isFinite(num)) ? `${fieldName} must be a valid number` : '';
  },

  positiveNumber: (value: string, fieldName: string) => {
    const num = parseFloat(value);
    return value && (isNaN(num) || num <= 0) ? `${fieldName} must be a positive number` : '';
  }
};
