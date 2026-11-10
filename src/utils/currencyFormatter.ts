/**
 * Currency Formatter for Indian Rupee (INR) and Indian Numbering System
 * Example: 1,06,988 or ₹1,06,988.50
 */

export function formatIndianCurrency(
  amount: number | null | undefined,
  includeSymbol: boolean = false,
  showDecimals: boolean = false
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return includeSymbol ? '₹ 0' : '0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'decimal',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });

  const formatted = formatter.format(absAmount);
  const prefix = isNegative ? '-' : '';
  const symbol = includeSymbol ? '₹ ' : '';

  return `${prefix}${symbol}${formatted}`;
}

/**
 * Format Indian numbers in words (Lakhs / Crores shorthand)
 * e.g., 1,50,000 -> 1.50 L
 */
export function formatLakhCroreCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    return `${sign}${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}${(abs / 1000).toFixed(1)} K`;
  }
  return `${sign}${abs}`;
}

