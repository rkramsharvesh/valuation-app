import { useState, useEffect } from 'react';
import { calculateDCF } from './utils/dcfcalculator.js';
import { fetchFinancials } from './utils/fetchFinancials.js';
import { getCountryRiskData, listCountries } from './utils/countryRiskData.js';
import CapitalStructure from './components/CapitalStructure.jsx';
import DividendPolicy from './components/DividendPolicy.jsx';
import RealOptions from './components/RealOptions.jsx';
import Governance from './components/Governance.jsx';
import ReinvestmentGrowth from './components/ReinvestmentGrowth.jsx';
import IndustryBenchmarking from './components/IndustryBenchmarking.jsx';
import { syntheticRatingForCoverage } from './utils/creditRating.js';
import SpecialValuations from './components/SpecialValuations.jsx';
import { getCurrencyForCountry, fetchFxRate, currencySymbols } from './utils/fx.js';

/**
 * Main application component. Provides a simple interface to pull company
 * financials, choose a country and compute a discounted cash flow valuation.
 */
export default function App() {
  // Five year cash flows. If company financials are fetched these values
  // auto‑populate with free cash flow to firm. Otherwise they default to empty
  // strings allowing manual entry.
  const [cashFlows, setCashFlows] = useState(['', '', '', '', '']);
  // Discount rate and terminal growth are stored internally as decimals (e.g. 0.12 for 12%).
  // We display these values to the user as percentages (e.g. 12) and convert back to
  // decimals on input change. Blank strings are used when no value is set.
  const [discountRate, setDiscountRate] = useState('');
  const [terminalGrowth, setTerminalGrowth] = useState('');
  const [result, setResult] = useState(null);
  const [country, setCountry] = useState('');
  const [ticker, setTicker] = useState('');
  const [companyData, setCompanyData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Additional states for enhanced functionality
  // Risk‑free rate and equity risk premium are prefilled from our country risk data
  // but remain editable by the user. Values are expressed as decimals (e.g. 0.05 for 5%).
  const [riskFreeRateInput, setRiskFreeRateInput] = useState('');
  const [equityRiskPremiumInput, setEquityRiskPremiumInput] = useState('');
  const [terminalMethod, setTerminalMethod] = useState('gordon');
  const [exitMultiple, setExitMultiple] = useState('');
  const [exitMetric, setExitMetric] = useState('');
  const [useUSD, setUseUSD] = useState(false);
  const [fxRate, setFxRate] = useState(1);

  // Format numbers using large unit suffixes (M, B, T) and keep two decimals
  function formatNumber(value) {
    const abs = Math.abs(value);
    if (abs >= 1e12) return (value / 1e12).toFixed(2) + 'T';
    if (abs >= 1e9) return (value / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return (value / 1e6).toFixed(2) + 'M';
    return value.toFixed(2);
  }
  // Convert values to selected currency (USD or native) and format
  function displayValue(value) {
    const num = Number(value);
    if (isNaN(num)) return 'N/A';
    const converted = useUSD ? num * fxRate : num;
    return formatNumber(converted);
  }

  // When the country selection changes update the risk‑free rate and ERP inputs
  useEffect(() => {
    if (!country) return;
    const riskData = getCountryRiskData(country);
    if (!riskData) return;
    // Prefill the inputs only when not manually set or when country changes
    setRiskFreeRateInput(riskData.riskFreeRate.toFixed(4));
    setEquityRiskPremiumInput(riskData.equityRiskPremium.toFixed(4));
  }, [country]);

  // Recompute the discount rate whenever risk parameters or company beta change
  useEffect(() => {
    if (!country || !companyData) return;
    const beta = parseFloat(companyData?.profile?.beta) || 1;
    const rf = parseFloat(riskFreeRateInput);
    const erp = parseFloat(equityRiskPremiumInput);
    if (isNaN(rf) || isNaN(erp)) return;
    const dr = rf + beta * erp;
    // Store as decimal but display as percentage later
    setDiscountRate(dr.toFixed(4));
  }, [riskFreeRateInput, equityRiskPremiumInput, companyData, country]);

  // Update FX conversion rate whenever the display currency or country changes.
  useEffect(() => {
    async function updateFx() {
      if (!useUSD || !country) {
        setFxRate(1);
        return;
      }
      const cur = getCurrencyForCountry(country);
      if (cur === 'USD') {
        setFxRate(1);
        return;
      }
      const rate = await fetchFxRate(cur);
      if (rate) {
        setFxRate(rate);
      } else {
        setFxRate(1);
      }
    }
    updateFx();
  }, [useUSD, country]);

  /**
   * When a country is selected and company data is available this function
   * computes the discount rate using the CAPM: r = rf + β × ERP. Risk
   * parameters come from our country dataset. Beta comes from the company
   * profile (FMP). If any data is missing the rate is not updated.
   */
  const computeDiscountRate = (countryName, data) => {
    if (!countryName || !data) return;
    const riskData = getCountryRiskData(countryName);
    if (!riskData) {
      console.warn('No risk data found for country', countryName);
      return;
    }
    const beta = parseFloat(data?.profile?.beta) || 1;
    const rf = riskData.riskFreeRate;
    const erp = riskData.equityRiskPremium;
    const dr = rf + beta * erp;
    setDiscountRate(dr.toFixed(4));
  };

  // update a specific cash flow input
  const handleChange = (index, value) => {
    const updated = [...cashFlows];
    updated[index] = value;
    setCashFlows(updated);
  };

  // perform the DCF calculation
  const handleSubmit = () => {
    const numericFlows = cashFlows.map((val) => parseFloat(val));
    const dr = parseFloat(discountRate);
    const tg = parseFloat(terminalGrowth);
    const tm = terminalMethod;
    const em = parseFloat(exitMultiple);
    const metric = parseFloat(exitMetric);
    const dcfResult = calculateDCF({
      cashFlows: numericFlows,
      discountRate: dr,
      terminalGrowth: tg,
      terminalMethod: tm,
      exitMultiple: em,
      exitMetric: metric,
    });
    setResult(dcfResult);
  };

  // validation to disable calculate button until inputs are sensible
  const isValidInput = () => {
    const numericFlows = cashFlows.map((val) => parseFloat(val));
    const dr = parseFloat(discountRate);
    const tg = parseFloat(terminalGrowth);
    return (
      numericFlows.every((cf) => !isNaN(cf) && cf >= 0) &&
      dr > 0 &&
      dr < 1 &&
      tg >= 0 &&
      tg < dr
    );
  };

  // Fetch financials for the entered ticker and optionally prefill cash flows
  const handleFetch = async () => {
    if (!ticker.trim()) {
      setError('Please enter a ticker symbol.');
      setCompanyData(null);
      return;
    }
    setLoading(true);
    const data = await fetchFinancials(ticker.trim().toUpperCase());
    setLoading(false);
    if (data && data.income && data.income.length > 0) {
      setCompanyData(data);
      setError('');
      // Extract 5 years of free cash flows from cashflow statement
      const latestFCFs = data.cashflow
        ?.slice(0, 5)
        .map((entry) => entry.freeCashFlow)
        .reverse();
      if (latestFCFs && latestFCFs.length === 5) {
        setCashFlows(latestFCFs.map((val) => (val ? val.toFixed(2) : '')));
      }
      // discount rate will be recomputed automatically via useEffect
    } else {
      setCompanyData(null);
      setError('Ticker not found. Please enter a valid listed company.');
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-xl p-8 space-y-6">
        <h1 className="text-2xl font-semibold text-center text-primary-dark">
          Discounted Cash Flow Valuation
        </h1>

        {/* Ticker and country selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="ticker">
              Stock Ticker
            </label>
            <div className="flex space-x-2">
              <input
                id="ticker"
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="e.g. AAPL"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-dark"
              />
              <button
                onClick={handleFetch}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Fetching…' : 'Fetch'}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="country">
              Country (for risk premium)
            </label>
            <input
              list="country-list"
              id="country"
              name="country"
              value={country}
              onChange={(e) => {
                const val = e.target.value;
                setCountry(val);
              }}
              placeholder="Start typing…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-dark"
            />
            <datalist id="country-list">
              {listCountries().map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Supported markets note */}
        <p className="text-xs text-gray-500">
          Note: Only companies registered and traded in the US, India, Japan and the UK are currently supported due to data availability.
        </p>

        {/* Risk‑free rate and equity risk premium inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Risk‑Free Rate</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.0001"
              value={riskFreeRateInput}
              onChange={(e) => setRiskFreeRateInput(e.target.value)}
              placeholder="0.0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
            />
            <p className="text-xs text-gray-500">Auto‑filled from the selected country’s 10‑year bond yield. You may adjust the value above.</p>
            {riskFreeRateInput && !isNaN(parseFloat(riskFreeRateInput)) && (
              <p className="text-xs text-gray-500">Current: {(parseFloat(riskFreeRateInput) * 100).toFixed(2)}%</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Equity Risk Premium</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.0001"
              value={equityRiskPremiumInput}
              onChange={(e) => setEquityRiskPremiumInput(e.target.value)}
              placeholder="0.0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
            />
            <p className="text-xs text-gray-500">Pulled from Damodaran’s country ERP table. You may adjust the value above if needed.</p>
            {equityRiskPremiumInput && !isNaN(parseFloat(equityRiskPremiumInput)) && (
              <p className="text-xs text-gray-500">Current: {(parseFloat(equityRiskPremiumInput) * 100).toFixed(2)}%</p>
            )}
          </div>
        </div>

        {/* Display country risk information if a country is selected */}
        {country && getCountryRiskData(country) && (
          <div className="mt-2 text-sm text-gray-600">
            {(() => {
              const data = getCountryRiskData(country);
              const matureERP = 0.0433; // Damodaran’s mature market ERP (4.33%)
              const erpPct = (data.equityRiskPremium * 100).toFixed(2);
              const diff = (data.equityRiskPremium - matureERP) * 100;
              const diffPct = diff.toFixed(2);
              return (
                <>
                  <p>
                    <span className="font-medium">Country Rating:</span> {data.rating} •{' '}
                    <span className="font-medium">ERP:</span> {erpPct}% •{' '}
                    <span className="font-medium">Country Risk Premium:</span> {diffPct}% (ERP {erpPct}% − Mature Market ERP 4.33%)
                  </p>
                  <p className="text-xs text-gray-500">
                    The country risk premium represents the extra return required above the mature market equity risk premium due to sovereign risk.
                  </p>
                </>
              );
            })()}
          </div>
        )}

        {/* Company information */}
        {companyData && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-medium">
              {companyData.profile.companyName} ({companyData.profile.symbol})
            </h2>
            <p className="text-sm text-gray-600">
              Sector: {companyData.profile.sector} • Market Cap: {' '}
              {(() => {
                const mkt = parseFloat(companyData.profile.mktCap);
                if (isNaN(mkt)) return 'N/A';
                // Convert to selected currency
                const converted = useUSD ? mkt * fxRate : mkt;
                const full = converted.toLocaleString(undefined, { maximumFractionDigits: 0 });
                const abbreviated = formatNumber(converted);
                const symbol = currencySymbols[useUSD ? 'USD' : getCurrencyForCountry(country)] ?? (useUSD ? 'USD' : getCurrencyForCountry(country));
                return `${symbol}${full} (${symbol}${abbreviated})`;
              })()}
            </p>
          </div>
        )}

        {/* Cash flow inputs */}
        <div>
          <h3 className="text-lg font-medium mb-2">Free Cash Flows (₹ / $)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {cashFlows.map((val, idx) => (
              <input
                key={idx}
                type="number"
                min="0"
                step="0.01"
                value={val}
                placeholder={`Year ${idx + 1}`}
                onChange={(e) => handleChange(idx, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-dark"
              />
            ))}
          </div>
        </div>

        {/* Discount and growth rates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="discount-rate">
              Discount Rate (% per annum)
            </label>
            <input
              id="discount-rate"
              type="number"
              min="0"
              max="99"
              step="0.01"
              placeholder="e.g. 10 for 10%"
              value={discountRate === '' ? '' : (parseFloat(discountRate) * 100).toFixed(2)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (isNaN(val)) {
                  setDiscountRate('');
                } else {
                  // convert percentage to decimal
                  setDiscountRate((val / 100).toString());
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-dark"
            />
            <p className="text-xs text-gray-500">Auto‑computed via CAPM using country risk data and beta. You may adjust the percentage above.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="terminal-growth">
              Terminal Growth Rate (% per annum)
            </label>
            <input
              id="terminal-growth"
              type="number"
              min="0"
              max="99"
              step="0.01"
              placeholder="e.g. 3 for 3%"
              value={terminalGrowth === '' ? '' : (parseFloat(terminalGrowth) * 100).toFixed(2)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (isNaN(val)) {
                  setTerminalGrowth('');
                } else {
                  setTerminalGrowth((val / 100).toString());
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-dark"
            />
            <p className="text-xs text-gray-500">Long‑term growth must be below the discount rate; typical values between 0–5%.</p>
          </div>
        </div>

        {/* Terminal value method selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Terminal Value Method</label>
            <select
              value={terminalMethod}
              onChange={(e) => setTerminalMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
            >
              <option value="gordon">Gordon Growth Model</option>
              <option value="exit">Exit Multiple</option>
            </select>
            <p className="text-xs text-gray-500">Choose how to estimate the terminal value: perpetual growth or an exit multiple.</p>
          </div>
          {terminalMethod === 'exit' && (
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium mb-1">Exit Multiple</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={exitMultiple}
                  onChange={(e) => setExitMultiple(e.target.value)}
                  placeholder="e.g. 8 (EV/EBITDA multiple)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Exit Metric</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={exitMetric}
                  onChange={(e) => setExitMetric(e.target.value)}
                  placeholder="Metric value in final year (e.g. EBITDA)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
                />
              </div>
              <p className="text-xs text-gray-500">Terminal value = Exit Multiple × Exit Metric</p>
            </div>
          )}
        </div>

        {/* Currency selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Display Currency</label>
            <select
              value={useUSD ? 'usd' : 'native'}
              onChange={(e) => setUseUSD(e.target.value === 'usd')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
            >
              <option value="native">Native ({country ? getCurrencyForCountry(country) : 'N/A'})</option>
              <option value="usd">USD Equivalent</option>
            </select>
            <p className="text-xs text-gray-500">Convert values using latest FX rates.</p>
          </div>
        </div>

        {/* Calculate button */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={!isValidInput()}
            className="px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Calculate DCF
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold mb-3">Valuation Results</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Intrinsic Value:</span> {currencySymbols[useUSD ? 'USD' : getCurrencyForCountry(country)] ?? (useUSD ? 'USD' : getCurrencyForCountry(country))}
                {displayValue(result.intrinsicValue)}
              </p>
              <p>
                <span className="font-medium">Terminal Value (PV):</span> {currencySymbols[useUSD ? 'USD' : getCurrencyForCountry(country)] ?? (useUSD ? 'USD' : getCurrencyForCountry(country))}
                {displayValue(result.terminalValue)}
              </p>
              {/* Share price comparison */}
              {companyData?.profile?.sharesOutstanding && (
                (() => {
                  const shares = parseFloat(companyData.profile.sharesOutstanding);
                  const price = parseFloat(companyData.profile.price);
                  if (isNaN(shares) || shares <= 0) return null;
                  // compute intrinsic and market prices in chosen currency
                  const intrinsicShare = result.intrinsicValue / shares;
                  const intrinsicDisplay = formatNumber(useUSD ? intrinsicShare * fxRate : intrinsicShare);
                  let marketDisplay = 'N/A';
                  let comment = '';
                  if (!isNaN(price)) {
                    const marketPriceConverted = useUSD ? price : price / fxRate;
                    marketDisplay = formatNumber(marketPriceConverted);
                    if (intrinsicShare > marketPriceConverted) {
                      comment = 'undervalued';
                    } else if (intrinsicShare < marketPriceConverted) {
                      comment = 'overvalued';
                    } else {
                      comment = 'fairly valued';
                    }
                  }
                  const sym = currencySymbols[useUSD ? 'USD' : getCurrencyForCountry(country)] ?? (useUSD ? 'USD' : getCurrencyForCountry(country));
                  return (
                    <div className="space-y-1">
                      <p>
                        <span className="font-medium">Intrinsic Share Price:</span> {sym}{intrinsicDisplay}
                      </p>
                      {marketDisplay !== 'N/A' && (
                        <p>
                          <span className="font-medium">Market Price:</span> {sym}{marketDisplay}
                        </p>
                      )}
                      {comment && (
                        <p className="italic text-xs text-gray-500">The stock appears {comment} relative to intrinsic value.</p>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
            <div className="mt-4">
              <h3 className="font-medium mb-1">Present Values of Cash Flows</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                {result.presentValues.map((pv, idx) => (
                  <li key={idx}>
                    Year {idx + 1}: {currencySymbols[useUSD ? 'USD' : getCurrencyForCountry(country)] ?? (useUSD ? 'USD' : getCurrencyForCountry(country))}
                    {displayValue(pv)}
                  </li>
                ))}
              </ul>
            </div>
            {result.flags.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium text-red-600">Warnings / Flags</h3>
                <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                  {result.flags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Download report and template buttons */}
            <div className="mt-4 space-x-2">
              <button
                onClick={() => {
                  // Build a comprehensive Markdown report summarising inputs, assumptions and results
                  const symbol = currencySymbols[useUSD ? 'USD' : getCurrencyForCountry(country)] ?? (useUSD ? 'USD' : getCurrencyForCountry(country));
                  const rf = parseFloat(riskFreeRateInput);
                  const erp = parseFloat(equityRiskPremiumInput);
                  const beta = parseFloat(companyData?.profile?.beta) || 1;
                  const dr = parseFloat(discountRate);
                  const tg = parseFloat(terminalGrowth);
                  const riskData = getCountryRiskData(country) || {};
                  const mktCap = parseFloat(companyData?.profile?.mktCap || 0);
                  const convertedMkt = useUSD ? mktCap * fxRate : mktCap;
                  const mktFull = convertedMkt.toLocaleString(undefined, { maximumFractionDigits: 0 });
                  const mktAbbrev = formatNumber(convertedMkt);
                  const shares = parseFloat(companyData?.profile?.sharesOutstanding || 0);
                  let intrinsicShare = null;
                  let marketPrice = null;
                  let valuationComment = '';
                  if (shares > 0) {
                    intrinsicShare = result.intrinsicValue / shares;
                    const price = parseFloat(companyData?.profile?.price);
                    if (!isNaN(price)) {
                      marketPrice = useUSD ? price : price / fxRate;
                      if (intrinsicShare > marketPrice) {
                        valuationComment = 'Undervalued';
                      } else if (intrinsicShare < marketPrice) {
                        valuationComment = 'Overvalued';
                      } else {
                        valuationComment = 'Fairly valued';
                      }
                    }
                  }
                  let md = `# Valuation Report\n\n`;
                  md += `**Date:** ${new Date().toLocaleDateString()}\n\n`;
                  md += `## 1. Company Overview\n`;
                  md += `- **Name:** ${companyData?.profile?.companyName ?? 'N/A'}\n`;
                  md += `- **Ticker:** ${companyData?.profile?.symbol ?? ''}\n`;
                  md += `- **Sector:** ${companyData?.profile?.sector ?? 'N/A'}\n`;
                  md += `- **Country:** ${country || 'N/A'}\n`;
                  md += `- **Market Cap:** ${symbol}${mktFull} (${symbol}${mktAbbrev})\n`;
                  md += `- **Shares Outstanding:** ${shares ? shares.toLocaleString() : 'N/A'}\n`;
                  md += `\n`;
                  md += `## 2. Risk Parameters & Assumptions\n`;
                  md += `- **Risk‑Free Rate (rf):** ${(rf * 100).toFixed(2)}%\n`;
                  md += `- **Equity Risk Premium (ERP):** ${(erp * 100).toFixed(2)}%\n`;
                  md += `- **Country Rating:** ${riskData.rating ?? 'N/A'}\n`;
                  const matureERP = 0.0433;
                  const countryPremium = erp - matureERP;
                  md += `- **Country Risk Premium:** ${(countryPremium * 100).toFixed(2)}% (ERP ${(erp * 100).toFixed(2)}% − Mature Market ERP 4.33%)\n`;
                  md += `- **Beta (Levered):** ${beta}\n`;
                  md += `- **Discount Rate:** ${(dr * 100).toFixed(2)}%\n`;
                  md += `- **Terminal Growth Rate:** ${(tg * 100).toFixed(2)}%\n`;
                  md += `- **Terminal Method:** ${terminalMethod === 'gordon' ? 'Gordon Growth Model' : 'Exit Multiple'}\n`;
                  if (terminalMethod === 'exit') {
                    md += `  - **Exit Multiple:** ${exitMultiple}\n`;
                    md += `  - **Exit Metric:** ${exitMetric}\n`;
                  }
                  md += `- **Currency:** ${useUSD ? 'USD' : getCurrencyForCountry(country)}\n`;
                  md += `\n`;
                  md += `## 3. Cash Flow Inputs\n`;
                  cashFlows.forEach((cf, i) => {
                    md += `- Year ${i + 1}: ${parseFloat(cf).toLocaleString()}\n`;
                  });
                  md += `\n`;
                  md += `## 4. DCF Results\n`;
                  md += `- **Intrinsic Value:** ${symbol}${displayValue(result.intrinsicValue)} (${symbol}${result.intrinsicValue.toLocaleString(undefined, { maximumFractionDigits: 0 })})\n`;
                  md += `- **Terminal Value (PV):** ${symbol}${displayValue(result.terminalValue)} (${symbol}${result.terminalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })})\n`;
                  if (intrinsicShare != null) {
                    const intrinsicShareDisplay = formatNumber(useUSD ? intrinsicShare * fxRate : intrinsicShare);
                    md += `- **Intrinsic Share Price:** ${symbol}${intrinsicShareDisplay} (${symbol}${(useUSD ? intrinsicShare * fxRate : intrinsicShare).toLocaleString(undefined, { maximumFractionDigits: 2 })})\n`;
                  }
                  if (marketPrice != null) {
                    md += `- **Market Price:** ${symbol}${formatNumber(marketPrice)} (${symbol}${marketPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })})\n`;
                    md += `- **Valuation Comment:** ${valuationComment}\n`;
                  }
                  md += `\n`;
                  md += `### Present Values of Cash Flows\n`;
                  result.presentValues.forEach((pv, i) => {
                    md += `- Year ${i + 1}: ${symbol}${displayValue(pv)}\n`;
                  });
                  md += `\n`;
                  if (result.flags.length > 0) {
                    md += `### Warnings / Flags\n`;
                    result.flags.forEach((flag) => {
                      md += `- ${flag}\n`;
                    });
                    md += `\n`;
                  }

                  // Compute and append capital structure analysis if metrics available
                  if (companyData?.metrics && companyData.metrics.totalDebt != null) {
                    const metrics = companyData.metrics;
                    const totalDebt = metrics.totalDebt;
                    const couponRateAuto = metrics.couponRate ?? 0;
                    const icr = metrics.icr;
                    const maturity = 5;
                    const riskData = getCountryRiskData(country) || {};
                    const rfDec = parseFloat(riskFreeRateInput) || riskData.riskFreeRate || 0;
                    const spreadInfo = syntheticRatingForCoverage(icr || 0);
                    const defaultSpread = spreadInfo.spread;
                    const synRating = spreadInfo.rating;
                    const ytm = rfDec + defaultSpread;
                    const coupon = couponRateAuto * totalDebt;
                    const pvCoupons = couponRateAuto > 0 && ytm > 0 ? (coupon / ytm) * (1 - Math.pow(1 + ytm, -maturity)) : 0;
                    const pvFace = totalDebt / Math.pow(1 + ytm, maturity);
                    const marketDebtEst = pvCoupons + pvFace;
                    const taxRateNum = typeof metrics.taxRate === 'number' ? metrics.taxRate : 0;
                    const costDebtAfterTax = ytm * (1 - taxRateNum);
                    const mktCapConv = convertedMkt;
                    const D = marketDebtEst;
                    const E = mktCapConv;
                    const Wd = (D + E) > 0 ? D / (D + E) : 0;
                    const We = (D + E) > 0 ? E / (D + E) : 0;
                    const betaLev = beta;
                    const unleveredBeta = betaLev / (1 + (1 - taxRateNum) * (D / E));
                    const releveredBeta = unleveredBeta * (1 + (1 - taxRateNum) * (D / E));
                    const costEquityCAPM = rfDec + releveredBeta * (parseFloat(equityRiskPremiumInput) || 0);
                    const wacc = Wd * ytm * (1 - taxRateNum) + We * costEquityCAPM;
                    // Compute DCF using WACC for demonstration
                    const numericFlows = cashFlows.map((v) => parseFloat(v));
                    const tg2 = parseFloat(terminalGrowth);
                    const tm2 = terminalMethod;
                    const em2 = parseFloat(exitMultiple);
                    const metric2 = parseFloat(exitMetric);
                    //const dcfWacc = calculateDCF({ cashFlows: numericFlows, discountRate: wacc, terminalGrowth: tg2, terminalMethod: tm2, exitMultiple: em2, exitMetric: metric2 });
                    // compute intrinsic value using WACC for info
                    const dcfWacc = calculateDCF({ cashFlows: numericFlows, discountRate: wacc, terminalGrowth: tg, terminalMethod: tm, exitMultiple: em, exitMetric: metric });
                    md += `## 5. Capital Structure Analysis\n`;
                    md += `- **Synthetic Rating:** ${synRating}\n`;
                    md += `- **Default Spread:** ${(defaultSpread * 100).toFixed(2)}%\n`;
                    md += `- **Market Value of Debt (estimate):** ${symbol}${displayValue(marketDebtEst)} (${symbol}${marketDebtEst.toLocaleString(undefined, { maximumFractionDigits: 0 })})\n`;
                    md += `- **Cost of Debt (YTM):** ${(ytm * 100).toFixed(2)}%\n`;
                    md += `- **After‑Tax Cost of Debt:** ${(costDebtAfterTax * 100).toFixed(2)}%\n`;
                    md += `- **Debt Weight (Wd):** ${Wd.toFixed(2)}\n`;
                    md += `- **Equity Weight (We):** ${We.toFixed(2)}\n`;
                    md += `- **Unlevered Beta:** ${unleveredBeta.toFixed(2)}\n`;
                    md += `- **Relevered Beta:** ${releveredBeta.toFixed(2)}\n`;
                    md += `- **Cost of Equity (CAPM):** ${(costEquityCAPM * 100).toFixed(2)}%\n`;
                    md += `- **Weighted Average Cost of Capital (WACC):** ${(wacc * 100).toFixed(2)}%\n`;
                    md += `- **Intrinsic Value at WACC:** ${symbol}${displayValue(dcfWacc.intrinsicValue)} (${symbol}${dcfWacc.intrinsicValue.toLocaleString(undefined, { maximumFractionDigits: 0 })})\n`;
                    md += `\n`;
                  }
                  // Output markdown
                  const blob = new Blob([md], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'valuation_report.md';
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}
                className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light"
              >
                Download Markdown Report
              </button>
              <button
                onClick={() => {
                  // Construct a CSV template similar to Damodaran’s spreadsheets
                  let csv = '';
                  csv += 'Year,Cash Flow,Present Value\n';
                  result.presentValues.forEach((pv, i) => {
                    const cf = parseFloat(cashFlows[i]);
                    csv += `${i + 1},${cf.toFixed(2)},${pv.toFixed(2)}\n`;
                  });
                  csv += `Terminal,${result.terminalValue.toFixed(2)},${result.terminalValue.toFixed(2)}\n`;
                  csv += `Intrinsic Value,,${result.intrinsicValue.toFixed(2)}\n`;
                  // Additional summary rows
                  csv += `Discount Rate,${discountRate},\n`;
                  csv += `Terminal Growth Rate,${terminalGrowth},\n`;
                  csv += `Method,${terminalMethod},\n`;
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'valuation_template.csv';
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}
                className="mt-2 px-4 py-2 bg-primary-dark text-white rounded-md hover:bg-primary"
              >
                Download CSV Template
              </button>
              <button
                onClick={async () => {
                  // Generate PDF report using jsPDF; fallback to alert if import fails
                  try {
                    const { jsPDF } = await import('jspdf');
                    const doc = new jsPDF();
                    let y = 10;
                    doc.setFontSize(14);
                    doc.text('Valuation Report', 10, y);
                    y += 8;
                    doc.setFontSize(10);
                    const addLine = (text) => {
                      doc.text(String(text), 10, y);
                      y += 6;
                    };
                    addLine(`Date: ${new Date().toLocaleDateString()}`);
                    addLine(`Company: ${companyData?.profile?.companyName ?? 'N/A'} (${companyData?.profile?.symbol ?? ''})`);
                    addLine(`Country: ${country}`);
                    const riskData = getCountryRiskData(country);
                    if (riskData) {
                      addLine(`Risk‑Free Rate: ${(riskData.riskFreeRate * 100).toFixed(2)}%`);
                      addLine(`Equity Risk Premium: ${(riskData.equityRiskPremium * 100).toFixed(2)}%`);
                      addLine(`Country Rating: ${riskData.rating}`);
                      addLine(`Country Risk Premium: ${(riskData.countryRiskPremium * 100).toFixed(2)}%`);
                    }
                    addLine(`Beta: ${companyData?.profile?.beta ?? 'N/A'}`);
                    // Synthetic rating and cost of debt from metrics
                    if (companyData?.metrics?.icr && companyData?.metrics?.totalDebt) {
                      const { rating: synRating, spread } = syntheticRatingForCoverage(companyData.metrics.icr);
                      const ytm = (riskData?.riskFreeRate ?? 0.04) + spread;
                      addLine(`Synthetic Rating: ${synRating}`);
                      addLine(`Default Spread: ${(spread * 100).toFixed(2)}%`);
                      addLine(`Cost of Debt (YTM): ${(ytm * 100).toFixed(2)}%`);
                    }
                    addLine(`Discount Rate: ${(parseFloat(discountRate) * 100).toFixed(2)}%`);
                    addLine(`Terminal Growth Rate: ${(parseFloat(terminalGrowth) * 100).toFixed(2)}%`);
                    addLine(`Terminal Method: ${terminalMethod}`);
                    addLine(`Intrinsic Value: ${displayValue(result.intrinsicValue)} ${useUSD ? 'USD' : getCurrencyForCountry(country)}`);
                    addLine(`Terminal Value (PV): ${displayValue(result.terminalValue)} ${useUSD ? 'USD' : getCurrencyForCountry(country)}`);
                    if (companyData?.profile?.sharesOutstanding) {
                      const shares = parseFloat(companyData.profile.sharesOutstanding);
                      if (!isNaN(shares) && shares > 0) {
                        const intrinsicShare = result.intrinsicValue / shares;
                        addLine(`Intrinsic Share Price: ${formatNumber(useUSD ? intrinsicShare * fxRate : intrinsicShare)} ${useUSD ? 'USD' : getCurrencyForCountry(country)}`);
                        const price = parseFloat(companyData.profile.price);
                        if (!isNaN(price)) {
                          const marketPriceUSD = useUSD ? price : price / fxRate;
                          addLine(`Market Price: ${formatNumber(marketPriceUSD)} ${useUSD ? 'USD' : getCurrencyForCountry(country)}`);
                          if (intrinsicShare > marketPriceUSD) {
                            addLine('Valuation Comment: Stock appears undervalued');
                          } else if (intrinsicShare < marketPriceUSD) {
                            addLine('Valuation Comment: Stock appears overvalued');
                          } else {
                            addLine('Valuation Comment: Stock appears fairly valued');
                          }
                        }
                      }
                    }
                    doc.save('valuation_report.pdf');
                  } catch (err) {
                    alert('PDF generation failed. Please ensure jsPDF library is available.');
                  }
                }}
                className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light"
              >
                Download PDF Report
              </button>
            </div>
          </div>
        )}

        {/* Additional analysis modules */}
        <CapitalStructure
          baseBeta={parseFloat(companyData?.profile?.beta) || 1}
          riskFreeRate={riskFreeRateInput ? parseFloat(riskFreeRateInput) : getCountryRiskData(country)?.riskFreeRate ?? 0.04}
          equityRiskPremium={equityRiskPremiumInput ? parseFloat(equityRiskPremiumInput) : getCountryRiskData(country)?.equityRiskPremium ?? 0.05}
          discountRate={parseFloat(discountRate) || 0.1}
          cashFlows={cashFlows}
          terminalGrowth={parseFloat(terminalGrowth) || 0}
          terminalMethod={terminalMethod}
          exitMultiple={exitMultiple ? parseFloat(exitMultiple) : undefined}
          exitMetric={exitMetric ? parseFloat(exitMetric) : undefined}
          baselineIntrinsicValue={result?.intrinsicValue}
          metrics={companyData?.metrics || {}}
          countryRiskPremium={getCountryRiskData(country)?.countryRiskPremium ?? 0}
          marketCap={companyData?.profile?.mktCap}
          currencySymbol={currencySymbols[useUSD ? 'USD' : getCurrencyForCountry(country)] ?? (useUSD ? 'USD' : getCurrencyForCountry(country))}
          displayValue={displayValue}
        />
        <DividendPolicy
          ticker={ticker}
          cashFlows={cashFlows}
          discountRate={parseFloat(discountRate) || 0.1}
          terminalGrowth={parseFloat(terminalGrowth) || 0}
          terminalMethod={terminalMethod}
          exitMultiple={exitMultiple ? parseFloat(exitMultiple) : undefined}
          exitMetric={exitMetric ? parseFloat(exitMetric) : undefined}
          displayValue={displayValue}
          currencySymbol={currencySymbols[useUSD ? 'USD' : getCurrencyForCountry(country)] ?? (useUSD ? 'USD' : getCurrencyForCountry(country))}
        />
        <RealOptions
          riskFreeRate={riskFreeRateInput ? parseFloat(riskFreeRateInput) : getCountryRiskData(country)?.riskFreeRate ?? 0.04}
        />
        <ReinvestmentGrowth />
        <Governance currentDiscountRate={parseFloat(discountRate) || null} />
        <SpecialValuations
          cashFlows={cashFlows}
          discountRate={parseFloat(discountRate) || 0.1}
          terminalGrowth={parseFloat(terminalGrowth) || 0}
          terminalMethod={terminalMethod}
          exitMultiple={exitMultiple ? parseFloat(exitMultiple) : undefined}
          exitMetric={exitMetric ? parseFloat(exitMetric) : undefined}
          baselineIntrinsicValue={result?.intrinsicValue}
          displayValue={displayValue}
          currencySymbol={currencySymbols[useUSD ? 'USD' : getCurrencyForCountry(country)] ?? (useUSD ? 'USD' : getCurrencyForCountry(country))}
        />

        {/* Industry benchmarking module */}
        <IndustryBenchmarking ticker={ticker} />
      </div>
    </div>
  );
}