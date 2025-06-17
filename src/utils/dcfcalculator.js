function round(value, decimals = 5) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

export function calculateDCF({ cashFlows, discountRate, terminalGrowth }) {
  const results = {
    presentValues: [],
    terminalValue: 0,
    intrinsicValue: 0,
    flags: [],
  };

  // --- Sanity Checks ---
  if (!Array.isArray(cashFlows) || cashFlows.length === 0) {
    results.flags.push("Cash flows input is invalid or empty.");
    return results;
  }

  if (discountRate <= 0 || discountRate >= 1) {
    results.flags.push("Discount rate must be between 0 and 1 (e.g., 0.12 for 12%).");
  }

  if (terminalGrowth < 0 || terminalGrowth >= discountRate) {
    results.flags.push("Terminal growth must be non-negative and less than the discount rate.");
  }

  // --- Calculate Present Values of Cash Flows ---
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

  // --- Calculate Terminal Value (using Gordon Growth Model) ---
  const lastCF = cashFlows[cashFlows.length - 1];
  if (!isNaN(lastCF)) {
    const terminalValue = (lastCF * (1 + g)) / (r - g);
    const terminalPV = terminalValue / Math.pow(1 + r, cashFlows.length);
    results.terminalValue = terminalPV;
    intrinsicValue += terminalPV;
  } else {
    results.flags.push("Last cash flow is invalid; skipping terminal value calculation.");
  }

  results.intrinsicValue = intrinsicValue;

  return results;
}

