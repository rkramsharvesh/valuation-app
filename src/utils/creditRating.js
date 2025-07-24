/*
 * Utilities for estimating a synthetic credit rating and default spread
 * based on a firm’s interest coverage ratio. These tables derive from
 * Professor Damodaran’s data for high market cap firms【869870716357044†L118-L209】.
 * Given an interest coverage ratio (EBIT / Interest Expense), the
 * syntheticRatingForCoverage function returns an object with the
 * corresponding rating label and a default spread (decimal). This
 * spread can be added to the risk‑free rate to estimate a pre‑tax
 * cost of debt when a market yield is not directly observable.
 */

const ratingTable = [
  { min: 8.5, max: Infinity, rating: 'AAA', spread: 0.0075 },
  { min: 6.5, max: 8.5, rating: 'AA', spread: 0.01 },
  { min: 5.5, max: 6.5, rating: 'A+', spread: 0.015 },
  { min: 4.25, max: 5.5, rating: 'A', spread: 0.018 },
  { min: 3, max: 4.25, rating: 'A-', spread: 0.02 },
  { min: 2.5, max: 3, rating: 'BBB', spread: 0.0225 },
  { min: 2.0, max: 2.5, rating: 'BB', spread: 0.035 },
  { min: 1.75, max: 2.0, rating: 'B+', spread: 0.0475 },
  { min: 1.5, max: 1.75, rating: 'B', spread: 0.065 },
  { min: 1.25, max: 1.5, rating: 'B-', spread: 0.08 },
  { min: 0.8, max: 1.25, rating: 'CCC', spread: 0.10 },
  { min: 0.65, max: 0.8, rating: 'CC', spread: 0.115 },
  { min: 0.2, max: 0.65, rating: 'C', spread: 0.127 },
  { min: 0, max: 0.2, rating: 'D', spread: 0.14 },
];

/**
 * Estimate a synthetic rating based on the interest coverage ratio.
 *
 * @param {number} icr Interest coverage ratio (EBIT / Interest Expense).
 * @returns {{rating: string, spread: number}} Rating label and default spread.
 */
export function syntheticRatingForCoverage(icr) {
  if (typeof icr !== 'number' || icr < 0) {
    return { rating: 'N/A', spread: 0.0 };
  }
  for (const row of ratingTable) {
    if (icr >= row.min && icr < row.max) {
      return { rating: row.rating, spread: row.spread };
    }
  }
  // Fallback
  return { rating: 'D', spread: 0.14 };
}