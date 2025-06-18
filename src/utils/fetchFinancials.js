const API_KEY = "ZWomosa9flSltWN1qqgfNfsqAXyxgsLl";
const BASE_URL = "https://financialmodelingprep.com/api/v3";

export async function fetchFinancials(ticker) {
  const endpoints = {
    income: `${BASE_URL}/income-statement/${ticker}?limit=5&apikey=${API_KEY}`,
    balance: `${BASE_URL}/balance-sheet-statement/${ticker}?limit=5&apikey=${API_KEY}`,
    cashflow: `${BASE_URL}/cash-flow-statement/${ticker}?limit=5&apikey=${API_KEY}`,
    profile: `${BASE_URL}/profile/${ticker}?apikey=${API_KEY}`
  };

  try {
    const [incomeRes, balanceRes, cashflowRes, profileRes] = await Promise.all([
      fetch(endpoints.income),
      fetch(endpoints.balance),
      fetch(endpoints.cashflow),
      fetch(endpoints.profile)
    ]);

    const [incomeData, balanceData, cashflowData, profileData] = await Promise.all([
      incomeRes.json(),
      balanceRes.json(),
      cashflowRes.json(),
      profileRes.json()
    ]);

    return {
      income: incomeData,
      balance: balanceData,
      cashflow: cashflowData,
      profile: profileData[0] // array of 1 object
    };
  } catch (error) {
    console.error("Error fetching financials:", error);
    return null;
  }
}
