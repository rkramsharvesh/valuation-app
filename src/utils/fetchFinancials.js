// Utility to fetch financial data for a given ticker from FinancialModelingPrep.
// We request the last five years of income statement, balance sheet and cash
// flow statements along with company profile (which contains beta). See
// https://financialmodelingprep.com/developer/docs/ for details.

const API_KEY = 'ZWomosa9flSltWN1qqgfNfsqAXyxgsLl';
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

/**
 * Fetch basic financial statements and profile for a ticker symbol.
 *
 * @param {string} ticker The stock ticker symbol (e.g. AAPL).
 * @returns {Promise<{
 *   income: any[],
 *   balance: any[],
 *   cashflow: any[],
 *   profile: any
 * } | null>} Returns an object containing arrays of financials and a profile
 *   object, or null on failure.
 */
export async function fetchFinancials(ticker) {
  const endpoints = {
    income: `${BASE_URL}/income-statement/${ticker}?limit=5&apikey=${API_KEY}`,
    balance: `${BASE_URL}/balance-sheet-statement/${ticker}?limit=5&apikey=${API_KEY}`,
    cashflow: `${BASE_URL}/cash-flow-statement/${ticker}?limit=5&apikey=${API_KEY}`,
    profile: `${BASE_URL}/profile/${ticker}?apikey=${API_KEY}`,
  };
  try {
    const [incRes, balRes, cfRes, profRes] = await Promise.all([
      fetch(endpoints.income),
      fetch(endpoints.balance),
      fetch(endpoints.cashflow),
      fetch(endpoints.profile),
    ]);
    if (!incRes.ok || !balRes.ok || !cfRes.ok || !profRes.ok) {
      return null;
    }
    const [incomeData, balanceData, cashflowData, profileData] = await Promise.all([
      incRes.json(),
      balRes.json(),
      cfRes.json(),
      profRes.json(),
    ]);
    // Compute additional metrics for synthetic bond and cost of debt estimation
    let totalDebt = null;
    let interestExpense = null;
    let icr = null;
    let couponRate = null;
    let taxRate = null;
    // Use the most recent year (first entry) for these calculations
    const latestIncome = incomeData && incomeData.length > 0 ? incomeData[0] : null;
    const latestBalance = balanceData && balanceData.length > 0 ? balanceData[0] : null;
    if (latestBalance) {
      // total debt: use totalDebt or longTermDebt + shortTermDebt
      const lt = parseFloat(latestBalance.longTermDebt ?? 0);
      const st = parseFloat(latestBalance.shortTermDebt ?? 0);
      const td = parseFloat(latestBalance.totalDebt ?? (lt + st));
      if (!isNaN(td)) totalDebt = td;
    }
    if (latestIncome) {
      const interest = parseFloat(latestIncome.interestExpense ?? 0);
      const ebit = parseFloat(latestIncome.ebit ?? latestIncome.ebitda ?? 0);
      // interestExpense may be negative; take absolute value
      if (!isNaN(interest)) interestExpense = Math.abs(interest);
      if (interestExpense != null && !isNaN(ebit) && ebit !== 0) {
        icr = interestExpense > 0 ? ebit / interestExpense : null;
      }
      // approximate coupon rate as interestExpense / totalDebt
      if (totalDebt != null && totalDebt > 0 && interestExpense != null) {
        couponRate = interestExpense / totalDebt;
      }
      // compute marginal tax rate from income statement: tax expense / pre‑tax income
      const incomeBeforeTax = parseFloat(latestIncome.incomeBeforeTax ?? 0);
      const incomeTaxExpense = parseFloat(latestIncome.incomeTaxExpense ?? 0);
      if (!isNaN(incomeTaxExpense) && !isNaN(incomeBeforeTax) && incomeBeforeTax !== 0) {
        taxRate = Math.abs(incomeTaxExpense) / Math.abs(incomeBeforeTax);
      }
    }
    return {
      income: incomeData,
      balance: balanceData,
      cashflow: cashflowData,
      profile: profileData[0] ?? {},
      metrics: {
        totalDebt,
        interestExpense,
        icr,
        couponRate,
        taxRate,
      },
    };
  } catch (err) {
    console.error('Error fetching financials:', err);
    return null;
  }
}