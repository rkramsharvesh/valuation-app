import { useState, useEffect } from 'react';
import { calculateDCF } from '../utils/dcfcalculator.js';

/**
 * Dividend and buyback policy module. This component allows users to enter
 * historical or forecasted dividends, compute an implied payout ratio and
 * toggle between an FCFE based valuation and a dividend discount model.
 * The intrinsic value is recalculated for each regime so that the impact
 * of payout versus reinvestment decisions can be illustrated. If no
 * dividend data is provided the FCFE cash flows are used for both cases.
 */
export default function DividendPolicy({
  ticker = '',
  cashFlows = [],
  discountRate,
  terminalGrowth,
  terminalMethod = 'gordon',
  exitMultiple,
  exitMetric,
  displayValue = (v) => v.toFixed(2),
  currencySymbol = '',
}) {
  // Dividends array holds five values corresponding to each forecast year
  const [dividends, setDividends] = useState(() => cashFlows.map(() => ''));
  const [valuationChoice, setValuationChoice] = useState('fcfe');
  const [analysis, setAnalysis] = useState(null);

  // Fetch dividend history when the ticker changes
  useEffect(() => {
    async function fetchDividends() {
      if (!ticker) {
        setDividends(cashFlows.map(() => ''));
        return;
      }
      try {
        const API_KEY = 'ZWomosa9flSltWN1qqgfNfsqAXyxgsLl';
        const url = `https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${ticker}?apikey=${API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch dividend data');
        const data = await res.json();
        const hist = data?.historical ?? [];
        // Aggregate dividends by year
        const yearDivs = {};
        hist.forEach((entry) => {
          const date = entry.date || entry.paymentDate;
          if (!date) return;
          const yr = new Date(date).getFullYear();
          const div = parseFloat(entry.dividend ?? entry.adjDividend ?? 0);
          if (!isNaN(div)) {
            yearDivs[yr] = (yearDivs[yr] || 0) + div;
          }
        });
        // Determine the most recent five years of dividends
        const years = Object.keys(yearDivs)
          .map((y) => parseInt(y, 10))
          .sort((a, b) => b - a);
        const vals = [];
        for (let i = 0; i < 5; i++) {
          const yr = years[i];
          if (yr != null) {
            const totalDiv = yearDivs[yr];
            vals.push(totalDiv != null ? totalDiv.toFixed(2) : '');
          } else {
            vals.push('');
          }
        }
        // If we fetched fewer than 5 values, pad the rest with blanks
        while (vals.length < 5) vals.push('');
        setDividends(vals);
      } catch (err) {
        console.error('Error fetching dividends for', ticker, err);
        // fall back to blanks
        setDividends(cashFlows.map(() => ''));
      }
    }
    fetchDividends();
  }, [ticker]);

  const handleDividendChange = (index, value) => {
    const arr = [...dividends];
    arr[index] = value;
    setDividends(arr);
  };

  const computePayoutAndValuation = () => {
    // parse numeric arrays
    const cf = cashFlows.map((v) => parseFloat(v));
    const divs = dividends.map((v) => (v === '' ? null : parseFloat(v)));
    // compute implied payout ratio as average of dividend / cash flow when both positive
    let ratios = [];
    for (let i = 0; i < cf.length; i++) {
      const d = divs[i];
      const c = cf[i];
      if (d != null && !isNaN(d) && c > 0) {
        ratios.push(d / c);
      }
    }
    const payoutRatio = ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : null;
    // valuations
    const fcfeResult = calculateDCF({ cashFlows: cf, discountRate, terminalGrowth, terminalMethod, exitMultiple, exitMetric });
    const divFlows = divs.map((v, i) => (v != null && !isNaN(v) ? v : cf[i] * (payoutRatio != null ? payoutRatio : 0)));
    const dividendResult = calculateDCF({ cashFlows: divFlows, discountRate, terminalGrowth, terminalMethod, exitMultiple, exitMetric });
    setAnalysis({ payoutRatio, fcfeResult, dividendResult });
  };

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">Dividend & Buyback Policy</h3>
      <p className="text-sm text-gray-600 mb-3">
        Enter historical or projected dividends to estimate an implied payout
        ratio. Switch between FCFE and dividend‑based valuation to examine
        how payout versus reinvestment decisions affect intrinsic value.
      </p>
      <div>
        <h4 className="font-medium mb-1">Dividends per Year</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {dividends.map((val, idx) => (
            <input
              key={idx}
              type="number"
              min="0"
              step="0.01"
              value={val}
              onChange={(e) => handleDividendChange(idx, e.target.value)}
              placeholder={`Year ${idx + 1}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">Leave blank to infer using payout ratio × free cash flow to equity.</p>
        <p className="text-xs text-gray-500 mt-1">Dividend figures are auto‑fetched from Financial Modeling Prep when available. You may edit any value to override.</p>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">Valuation Method</label>
        <select
          value={valuationChoice}
          onChange={(e) => setValuationChoice(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
        >
          <option value="fcfe">Free Cash Flow to Equity (FCFE)</option>
          <option value="dividend">Dividend Discount Model</option>
        </select>
      </div>
      <div className="mt-4 text-center">
        <button
          onClick={computePayoutAndValuation}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light"
        >
          Analyse Dividend Policy
        </button>
      </div>
      {analysis && (
        <div className="mt-4 space-y-2 text-sm">
          {analysis.payoutRatio != null ? (
            <p><span className="font-medium">Implied Average Payout Ratio:</span> {(analysis.payoutRatio * 100).toFixed(2)}%</p>
          ) : (
            <p><span className="font-medium">Implied Average Payout Ratio:</span> Not enough data</p>
          )}
          <p><span className="font-medium">Intrinsic Value (FCFE):</span> {currencySymbol}{displayValue(analysis.fcfeResult.intrinsicValue)}</p>
          <p><span className="font-medium">Intrinsic Value (Dividend Model):</span> {currencySymbol}{displayValue(analysis.dividendResult.intrinsicValue)}</p>
          <p className="italic text-xs text-gray-500">
            Difference highlights how retaining cash to reinvest versus paying out
            earnings influences value. If the dividend model yields a lower
            value, it suggests that reinvestment opportunities may be value
            enhancing.
          </p>
        </div>
      )}
    </div>
  );
}