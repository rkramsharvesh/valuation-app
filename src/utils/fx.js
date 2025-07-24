/*
 * Helper functions for currency conversion. This module provides a mapping
 * between countries and their primary currency codes along with a function
 * to fetch live foreign exchange rates. It uses the free exchangerate.host
 * API which does not require an API key. If the API call fails the
 * function returns null, allowing the caller to handle errors gracefully.
 */

// Mapping from country names (as used in countryRiskData.js) to ISO currency codes.
export const countryCurrencies = {
  'United States': 'USD',
  China: 'CNY',
  India: 'INR',
  'United Kingdom': 'GBP',
  Germany: 'EUR',
  Japan: 'JPY',
  France: 'EUR',
  Canada: 'CAD',
  Brazil: 'BRL',
  Australia: 'AUD',
};

// Mapping from ISO currency codes to display symbols. These symbols help
// identify the unit when showing results. If a code is missing the code
// itself will be used instead.
export const currencySymbols = {
  USD: '$',
  INR: '₹',
  GBP: '£',
  EUR: '€',
  CNY: '¥',
  JPY: '¥',
  BRL: 'R$',
  CAD: 'C$',
  AUD: 'A$',
};

/**
 * Given a country name return the ISO currency code. Returns 'USD' as
 * a default if the country is not found.
 *
 * @param {string} name Country name.
 * @returns {string} Currency code (e.g., 'USD').
 */
export function getCurrencyForCountry(name) {
  if (!name) return 'USD';
  const key = Object.keys(countryCurrencies).find((c) => c.toLowerCase() === name.toLowerCase());
  return key ? countryCurrencies[key] : 'USD';
}

/**
 * Fetch the FX rate converting from the given base currency into USD.
 * For example if base is 'INR' and USD/INR = 0.012, the function will return
 * 0.012. If the API call fails or returns an error null is returned.
 *
 * @param {string} base Base currency code.
 * @returns {Promise<number|null>} Conversion rate from base to USD.
 */
export async function fetchFxRate(base) {
  try {
    const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=USD`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.USD;
    return typeof rate === 'number' ? rate : null;
  } catch (err) {
    console.error('Error fetching FX rate', err);
    return null;
  }
}