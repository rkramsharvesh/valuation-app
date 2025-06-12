function round(value, decimals = 5) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

export function calculateDCF({ cashFlows, discountRate, terminalGrowth }) {
  const years = cashFlows.length;
  let npv = 0;

  for (let i = 0; i < years; i++) {
    npv += cashFlows[i] / Math.pow(1 + discountRate, i + 1);
  }

  const finalYearFCF = cashFlows[years - 1];
  const terminalValueRaw = (finalYearFCF * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
  const discountedTerminal = terminalValueRaw / Math.pow(1 + discountRate, years);

  const roundedNPV = round(npv);
  const roundedTV = round(discountedTerminal);
  const totalDCF = round(roundedNPV + roundedTV);

  return {
    npv: roundedNPV,
    terminalValue: roundedTV,
    dcfValue: totalDCF,
  };
}
