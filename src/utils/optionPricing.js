/*
 * Simple Black–Scholes option pricing functions. These functions provide
 * European call and put prices assuming constant volatility and a risk‑free
 * rate. They can be used to value real options embedded in corporate
 * projects such as the option to delay, expand or abandon a project.
 *
 * NOTE: These implementations are provided for educational purposes and
 * mirror the formulas discussed in Dr. Damodaran's corporate finance
 * curriculum【912118369618408†L49-L56】. They assume continuous compounding
 * and may not capture all intricacies of real options (e.g., changing
 * volatilities, discrete dividends). However they are sufficient for
 * illustrating how flexibility can affect project value.
 */

// Standard normal cumulative distribution function using Abramowitz and Stegun
// approximation. See https://en.wikipedia.org/wiki/Normal_distribution#Cumulative_distribution_function
function normCDF(x) {
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2);
  // constants for approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * absX);
  const erf = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);
  return 0.5 * (1 + sign * erf);
}

/**
 * Compute the price of a European call option using the Black–Scholes model.
 *
 * @param {number} S Current value of the underlying project/investment.
 * @param {number} K Exercise price (cost to invest or expand).
 * @param {number} r Risk‑free rate (decimal). Use a consistent annual rate.
 * @param {number} sigma Volatility of the underlying (decimal). This can be
 *   proxied by the standard deviation of project returns or comparable
 *   asset volatility.
 * @param {number} T Time to maturity in years.
 * @returns {number} Call option value.
 */
export function blackScholesCall(S, K, r, sigma, T) {
  if (S <= 0 || K <= 0 || sigma <= 0 || T <= 0) return 0;
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
}

/**
 * Compute the price of a European put option using the Black–Scholes model.
 * Often used for the option to abandon a project.
 *
 * @param {number} S Current value of the underlying project/investment.
 * @param {number} K Exercise price (salvage value or cost foregone upon
 *   abandonment).
 * @param {number} r Risk‑free rate (decimal).
 * @param {number} sigma Volatility of the underlying (decimal).
 * @param {number} T Time to maturity in years.
 * @returns {number} Put option value.
 */
export function blackScholesPut(S, K, r, sigma, T) {
  if (S <= 0 || K <= 0 || sigma <= 0 || T <= 0) return 0;
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1);
}