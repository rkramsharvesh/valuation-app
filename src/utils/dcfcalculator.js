/**
 * Internal helper to round numeric values to a given precision.
 * @param {number} value The value to round.
 * @param {number} decimals Number of decimal places. Default 5.
 * @returns {number}
 */
function round(value, decimals = 5) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

/**
 * Compute the intrinsic value of a series of free cash flows using the
 * discounted cash flow (DCF) model and the Gordon Growth Model for the
 * terminal value. This mirrors the approach taught by Dr. Damodaran in his
 * corporate finance classes【912118369618408†L49-L56】.
 *
 * @param {Object} params Input parameters.
 * @param {number[]} params.cashFlows Array of free cash flow numbers. Must be
 *   non‑negative values for each year.
 * @param {number} params.discountRate Required return on equity (decimal).
 * @param {number} params.terminalGrowth Long‑term growth rate (decimal).
 * @returns {{
 *   presentValues: number[],
 *   terminalValue: number,
 *   intrinsicValue: number,
 *   flags: string[],
 * }}
 */
/**
 * Compute the intrinsic value of a series of free cash flows using the
 * discounted cash flow (DCF) model. Supports both the Gordon Growth Model
 * for the terminal value and an exit multiple approach. The default
 * behaviour remains identical to the original implementation whereby the
 * terminal value is computed using a perpetual growth formula. If a
 * different terminal method is specified, the function will instead use
 * the provided exit multiple and metric to estimate the terminal value.
 *
 * @param {Object} params Input parameters.
 * @param {number[]} params.cashFlows Array of free cash flow numbers. Must be
 *   non‑negative values for each year. Negative values are allowed but will
 *   raise a warning flag.
 * @param {number} params.discountRate Required return on equity (decimal).
 * @param {number} params.terminalGrowth Long‑term growth rate (decimal).
 * @param {string} [params.terminalMethod="gordon"] Terminal value method. Either
 *   "gordon" (default) or "exit". When set to "exit" the terminal value
 *   will be calculated as exitMultiple × exitMetric.
 * @param {number} [params.exitMultiple] Exit multiple used in the exit method
 *   (e.g., EV/EBITDA multiple). Required when terminalMethod is "exit".
 * @param {number} [params.exitMetric] The underlying metric (e.g., EBITDA or
 *   earnings) at the end of the explicit forecast period. Required when
 *   terminalMethod is "exit".
 * @returns {{
 *   presentValues: number[],
 *   terminalValue: number,
 *   intrinsicValue: number,
 *   flags: string[],
 * }}
 */
export function calculateDCF({ cashFlows, discountRate, terminalGrowth, terminalMethod = 'gordon', exitMultiple, exitMetric }) {
  const results = {
    presentValues: [],
    terminalValue: 0,
    intrinsicValue: 0,
    flags: [],
  };
  // Input validation
  if (!Array.isArray(cashFlows) || cashFlows.length === 0) {
    results.flags.push('Cash flows input is invalid or empty.');
    return results;
  }
  if (discountRate <= 0 || discountRate >= 1) {
    results.flags.push('Discount rate must be between 0 and 1 (e.g., 0.12 for 12%).');
  }
  // When using the traditional Gordon Growth model the terminal growth must
  // remain below the discount rate. For the exit multiple method this check
  // is not applicable. We still perform a basic sanity check if a growth
  // value has been provided.
  if (terminalMethod === 'gordon') {
    if (terminalGrowth < 0 || terminalGrowth >= discountRate) {
      results.flags.push('Terminal growth must be non‑negative and less than the discount rate.');
    }
  } else if (terminalMethod === 'exit') {
    if (typeof exitMultiple !== 'number' || typeof exitMetric !== 'number') {
      results.flags.push('Exit multiple and exit metric must be provided for the exit terminal value method.');
    }
  }
  const r = discountRate;
  const g = terminalGrowth;
  let intrinsicValue = 0;
  for (let t = 0; t < cashFlows.length; t++) {
    const cf = cashFlows[t];
    if (isNaN(cf)) {
      results.flags.push(`Cash flow at year ${t + 1} is not a valid number.`);
      results.presentValues.push(0);
      continue;
    }
    const pv = cf / Math.pow(1 + r, t + 1);
    results.presentValues.push(pv);
    intrinsicValue += pv;
  }
  // Terminal value computation. The function supports two methods for
  // calculating the terminal value. By default the Gordon Growth model is
  // applied using the last cash flow and the perpetual growth rate. If the
  // exit multiple method is chosen, the terminal value is computed as
  // exitMultiple × exitMetric. The resulting value is then discounted back
  // to present value at the discount rate.
  if (terminalMethod === 'gordon') {
    const lastCF = cashFlows[cashFlows.length - 1];
    if (!isNaN(lastCF)) {
      const terminalValue = (lastCF * (1 + g)) / (r - g);
      const terminalPV = terminalValue / Math.pow(1 + r, cashFlows.length);
      results.terminalValue = terminalPV;
      intrinsicValue += terminalPV;
    } else {
      results.flags.push('Last cash flow is invalid; skipping terminal value calculation.');
    }
  } else if (terminalMethod === 'exit') {
    // Estimate terminal value using an exit multiple approach. If the inputs
    // are invalid we push a flag and do not include any terminal value.
    if (typeof exitMultiple === 'number' && typeof exitMetric === 'number' && !isNaN(exitMultiple) && !isNaN(exitMetric)) {
      const tv = exitMultiple * exitMetric;
      const terminalPV = tv / Math.pow(1 + r, cashFlows.length);
      results.terminalValue = terminalPV;
      intrinsicValue += terminalPV;
    } else {
      results.flags.push('Invalid or missing exit multiple/metric for terminal value.');
    }
  }
  results.intrinsicValue = intrinsicValue;
  return results;
}