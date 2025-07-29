"use client";

import { useState, useEffect, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  number?: boolean;
  positiveNumber?: boolean;
  custom?: (value: string) => string | null;
  asyncValidation?: (value: string) => Promise<string | null>;
}

export interface FieldConfig {
  [fieldName: string]: ValidationRule;
}

export interface ValidationState {
  [fieldName: string]: {
    error: string | null;
    isValidating: boolean;
    touched: boolean;
  };
}

export interface FormData {
  [fieldName: string]: string;
}

export function useFormValidation(
  initialData: FormData,
  fieldConfig: FieldConfig,
  options: {
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    debounceMs?: number;
  } = {}
) {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300
  } = options;

  const [formData, setFormData] = useState<FormData>(initialData);
  const [validation, setValidation] = useState<ValidationState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize validation state
  useEffect(() => {
    const initialValidation: ValidationState = {};
    Object.keys(fieldConfig).forEach(fieldName => {
      initialValidation[fieldName] = {
        error: null,
        isValidating: false,
        touched: false
      };
    });
    setValidation(initialValidation);
  }, [fieldConfig]);

  // Validate a single field
  const validateField = useCallback(async (
    fieldName: string, 
    value: string,
    skipAsync = false
  ): Promise<string | null> => {
    const rules = fieldConfig[fieldName];
    if (!rules) return null;

    // Required validation
    if (rules.required && !value.trim()) {
      return `${fieldName} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value.trim() && !rules.required) {
      return null;
    }

    // Length validations
    if (rules.minLength && value.length < rules.minLength) {
      return `${fieldName} must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `${fieldName} must be no more than ${rules.maxLength} characters`;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return `${fieldName} format is invalid`;
    }

    // Email validation
    if (rules.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    // Number validation
    if (rules.number) {
      const num = parseFloat(value);
      if (isNaN(num) || !isFinite(num)) {
        return `${fieldName} must be a valid number`;
      }
    }

    // Positive number validation
    if (rules.positiveNumber) {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        return `${fieldName} must be a positive number`;
      }
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) return customError;
    }

    // Async validation
    if (rules.asyncValidation && !skipAsync) {
      try {
        const asyncError = await rules.asyncValidation(value);
        if (asyncError) return asyncError;
      } catch (error) {
        return 'Validation failed. Please try again.';
      }
    }

    return null;
  }, [fieldConfig]);

  // Debounced validation
  const debouncedValidate = useCallback(
    debounce(async (fieldName: string, value: string) => {
      setValidation(prev => ({
        ...prev,
        [fieldName]: { ...prev[fieldName], isValidating: true }
      }));

      const error = await validateField(fieldName, value);

      setValidation(prev => ({
        ...prev,
        [fieldName]: { 
          ...prev[fieldName], 
          error, 
          isValidating: false 
        }
      }));
    }, debounceMs),
    [validateField, debounceMs]
  );

  // Update field value
  const updateField = useCallback((fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));

    if (validateOnChange) {
      debouncedValidate(fieldName, value);
    }
  }, [validateOnChange, debouncedValidate]);

  // Handle field blur
  const handleBlur = useCallback(async (fieldName: string) => {
    setValidation(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], touched: true }
    }));

    if (validateOnBlur) {
      const value = formData[fieldName] || '';
      const error = await validateField(fieldName, value);
      
      setValidation(prev => ({
        ...prev,
        [fieldName]: { ...prev[fieldName], error }
      }));
    }
  }, [validateOnBlur, formData, validateField]);

  // Validate all fields
  const validateAll = useCallback(async (): Promise<boolean> => {
    const newValidation: ValidationState = { ...validation };
    let hasErrors = false;

    for (const fieldName of Object.keys(fieldConfig)) {
      const value = formData[fieldName] || '';
      const error = await validateField(fieldName, value, true); // Skip async for bulk validation
      
      newValidation[fieldName] = {
        ...newValidation[fieldName],
        error,
        touched: true
      };

      if (error) hasErrors = true;
    }

    setValidation(newValidation);
    return !hasErrors;
  }, [fieldConfig, formData, validateField, validation]);

  // Submit handler
  const handleSubmit = useCallback(async (
    onSubmit: (data: FormData) => Promise<void> | void
  ) => {
    setIsSubmitting(true);
    
    try {
      const isValid = await validateAll();
      
      if (isValid) {
        await onSubmit(formData);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateAll]);

  // Reset form
  const reset = useCallback((newData?: FormData) => {
    const dataToSet = newData || initialData;
    setFormData(dataToSet);
    
    const resetValidation: ValidationState = {};
    Object.keys(fieldConfig).forEach(fieldName => {
      resetValidation[fieldName] = {
        error: null,
        isValidating: false,
        touched: false
      };
    });
    setValidation(resetValidation);
    setIsSubmitting(false);
  }, [initialData, fieldConfig]);

  // Get field props for easy integration
  const getFieldProps = useCallback((fieldName: string) => ({
    value: formData[fieldName] || '',
    onChange: (value: string) => updateField(fieldName, value),
    onBlur: () => handleBlur(fieldName),
    error: validation[fieldName]?.touched ? validation[fieldName]?.error : null,
    isValidating: validation[fieldName]?.isValidating || false,
  }), [formData, validation, updateField, handleBlur]);

  // Check if form is valid
  const isValid = Object.values(validation).every(field => !field.error);
  const hasErrors = Object.values(validation).some(field => field.error && field.touched);
  const isValidating = Object.values(validation).some(field => field.isValidating);

  return {
    formData,
    validation,
    isSubmitting,
    isValid,
    hasErrors,
    isValidating,
    updateField,
    handleBlur,
    validateField,
    validateAll,
    handleSubmit,
    reset,
    getFieldProps
  };
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Common validation rules
export const commonValidationRules = {
  required: { required: true },
  email: { required: true, email: true },
  optionalEmail: { email: true },
  phone: { 
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    minLength: 8,
    maxLength: 15
  },
  currency: {
    positiveNumber: true,
    pattern: /^\d+(\.\d{1,2})?$/
  },
  taxId: {
    required: true,
    pattern: /^[A-Z0-9\-]+$/,
    minLength: 8,
    maxLength: 20
  },
  invoiceNumber: {
    required: true,
    pattern: /^[A-Z0-9\-]+$/,
    minLength: 3,
    maxLength: 50
  },
  percentage: {
    number: true,
    custom: (value: string) => {
      const num = parseFloat(value);
      if (num < 0 || num > 100) {
        return 'Percentage must be between 0 and 100';
      }
      return null;
    }
  }
};
