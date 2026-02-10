// Exchange rate utilities

const FRANKFURTER_API = 'https://api.frankfurter.app';

export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

// Fetch latest exchange rates from Frankfurter API (free, no key required)
export async function fetchExchangeRates(base = 'EUR'): Promise<ExchangeRates> {
  const response = await fetch(`${FRANKFURTER_API}/latest?from=${base}`);
  if (!response.ok) {
    throw new Error('Failed to fetch exchange rates');
  }
  return response.json();
}

// Fetch historical exchange rate for a specific date
export async function fetchHistoricalRate(
  date: string, 
  from: string, 
  to: string
): Promise<number> {
  const response = await fetch(`${FRANKFURTER_API}/${date}?from=${from}&to=${to}`);
  if (!response.ok) {
    throw new Error('Failed to fetch historical rate');
  }
  const data = await response.json();
  return data.rates[to];
}

// Convert amount from one currency to another
export function convertCurrency(
  amountCents: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>,
  baseCurrency = 'EUR'
): number {
  if (fromCurrency === toCurrency) return amountCents;
  
  let amountInBase = amountCents;
  
  // Convert to base currency first
  if (fromCurrency !== baseCurrency) {
    const fromRate = rates[fromCurrency];
    if (!fromRate) return amountCents; // Can't convert
    amountInBase = amountCents / fromRate;
  }
  
  // Convert to target currency
  if (toCurrency === baseCurrency) {
    return amountInBase;
  }
  
  const toRate = rates[toCurrency];
  if (!toRate) return amountCents; // Can't convert
  
  return amountInBase * toRate;
}

// Common currency symbols
export const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CHF: 'CHF',
  CAD: 'C$',
  AUD: 'A$',
  CNY: '¥',
  INR: '₹',
  BTC: '₿',
  ETH: 'Ξ',
};

export function getCurrencySymbol(currency: string): string {
  return currencySymbols[currency] || currency;
}
