'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TAX_CATEGORIES, TAX_SCHEMES, getTaxRateForCategory } from '@/lib/caminv/tax-constants';

interface TaxCategorySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  onTaxRateChange?: (rate: number) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

export function TaxCategorySelect({
  value,
  onValueChange,
  onTaxRateChange,
  disabled = false,
  label = 'Tax Category',
  placeholder = 'Select tax category'
}: TaxCategorySelectProps) {
  const handleValueChange = (newValue: string) => {
    onValueChange(newValue);
    
    // Auto-update tax rate based on category
    if (onTaxRateChange) {
      const rate = getTaxRateForCategory(newValue);
      onTaxRateChange(rate);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {TAX_CATEGORIES.map((category) => (
            <SelectItem key={category.value} value={category.value}>
              <div className="flex flex-col">
                <span className="font-medium">{category.value} - {category.label}</span>
                <span className="text-xs text-muted-foreground">{category.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface TaxSchemeSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

export function TaxSchemeSelect({
  value,
  onValueChange,
  disabled = false,
  label = 'Tax Scheme',
  placeholder = 'Select tax scheme'
}: TaxSchemeSelectProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {TAX_SCHEMES.map((scheme) => (
            <SelectItem key={scheme.value} value={scheme.value}>
              <div className="flex flex-col">
                <span className="font-medium">{scheme.value} - {scheme.label}</span>
                <span className="text-xs text-muted-foreground">{scheme.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface TaxDropdownsProps {
  taxCategory?: string;
  taxScheme?: string;
  onTaxCategoryChange: (value: string) => void;
  onTaxSchemeChange: (value: string) => void;
  onTaxRateChange?: (rate: number) => void;
  disabled?: boolean;
  className?: string;
}

export function TaxDropdowns({
  taxCategory,
  taxScheme,
  onTaxCategoryChange,
  onTaxSchemeChange,
  onTaxRateChange,
  disabled = false,
  className = ''
}: TaxDropdownsProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
      <TaxCategorySelect
        value={taxCategory}
        onValueChange={onTaxCategoryChange}
        onTaxRateChange={onTaxRateChange}
        disabled={disabled}
      />
      <TaxSchemeSelect
        value={taxScheme}
        onValueChange={onTaxSchemeChange}
        disabled={disabled}
      />
    </div>
  );
}
