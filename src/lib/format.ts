/**
 * Format a number as currency
 * @param amount The amount to format
 * @param currency The currency code (e.g., 'USD', 'EUR')
 * @param options Additional formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number, 
  currency: string, 
  options: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  // Validate currency parameter
  if (!currency || currency.trim() === '') {
    console.warn('Empty currency code provided. Using USD as fallback.');
    currency = 'USD';
  }
  
  // Set default options
  const {
    locale = 'en-US',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  } catch {
    // Fallback to USD if the currency code is invalid
    console.error(`Invalid currency code: ${currency}. Falling back to USD.`);
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  }
}

/**
 * Format a date to a human-readable string
 * @param date The date to format
 * @param locale The locale for formatting (defaults to 'en-US')
 * @returns Formatted date string
 */
export function formatDate(date: Date, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
} 