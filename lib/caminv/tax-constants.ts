/**
 * Tax Category constants based on CamInv documentation
 * Reference: https://doc-caminv.netlify.app/data-type/tax-category
 */
export const TAX_CATEGORIES = [
  { value: 'S', label: 'Standard Rate', description: 'Standard VAT rate (10%)' },
  { value: 'Z', label: 'Zero Rate', description: 'Zero-rated goods and services' },
  { value: 'E', label: 'Exempt', description: 'Exempt from VAT' },
  { value: 'O', label: 'Out of Scope', description: 'Outside the scope of VAT' },
] as const;

/**
 * Tax Scheme constants based on CamInv documentation
 * Reference: https://doc-caminv.netlify.app/data-type/tax-scheme
 */
export const TAX_SCHEMES = [
  { value: 'VAT', label: 'Value Added Tax', description: 'Cambodia VAT system' },
  { value: 'GST', label: 'Goods and Services Tax', description: 'Alternative tax scheme' },
] as const;

/**
 * Default tax rates for Cambodia
 */
export const DEFAULT_TAX_RATES = {
  S: 10, // Standard rate 10%
  Z: 0,  // Zero rate
  E: 0,  // Exempt
  O: 0,  // Out of scope
} as const;

/**
 * Get tax rate for a given category
 */
export function getTaxRateForCategory(category: string): number {
  return DEFAULT_TAX_RATES[category as keyof typeof DEFAULT_TAX_RATES] || 0;
}

/**
 * Get tax category label
 */
export function getTaxCategoryLabel(category: string): string {
  const taxCategory = TAX_CATEGORIES.find(tc => tc.value === category);
  return taxCategory ? taxCategory.label : category;
}

/**
 * Get tax scheme label
 */
export function getTaxSchemeLabel(scheme: string): string {
  const taxScheme = TAX_SCHEMES.find(ts => ts.value === scheme);
  return taxScheme ? taxScheme.label : scheme;
}
