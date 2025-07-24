import { useState } from 'react';
import { calculateDCF } from '../utils/dcfcalculator.js';

/**
 * Special valuation scenarios module. Handles situations where traditional
 * DCF may not be appropriate: distressed companies with negative cash flows,
 * financial service firms and private companies. Provides simple models and
 * adjustments to estimate value under these circumstances.
 */
export default function SpecialValuations({
  cashFlows = [],
  discountRate,
  terminalGrowth,
  terminalMethod = 'gordon',
  exitMultiple,
  exitMetric,
  baselineIntrinsicValue = null,
  displayValue = (v) => v.toFixed(2),
  currencySymbol = '',
}) {
  const [scenario, setScenario] = useState('general');
  // Distressed inputs
  const [failureProb, setFailureProb] = useState('');
  const [salvageValue, setSalvageValue] = useState('');
  // Financial inputs
  const [bookValue, setBookValue] = useState('');
  const [roe, setRoe] = useState('');
  // Private inputs
  const [illiquidityDiscount, setIlliquidityDiscount] = useState('');
  const [controlPremium, setControlPremium] = useState('');
  const [result, setResult] = useState(null);

  const compute = () => {
    const cf = cashFlows.map((v) => parseFloat(v));
    let value = null;
    let methodDesc = '';
    if (scenario === 'general') {
      const res = calculateDCF({ cashFlows: cf, discountRate, terminalGrowth, terminalMethod, exitMultiple, exitMetric });
      value = res.intrinsicValue;
      methodDesc = 'Standard DCF valuation';
    } else if (scenario === 'distressed') {
      const pFail = parseFloat(failureProb);
      const salvage = parseFloat(salvageValue);
      if (isNaN(pFail) || isNaN(salvage)) {
        setResult(null);
        return;
      }
      const res = calculateDCF({ cashFlows: cf, discountRate, terminalGrowth, terminalMethod, exitMultiple, exitMetric });
      // probability weighted value: PV = pSurvival × DCF + pFail × salvage
      const pSurvival = Math.max(0, Math.min(1, 1 - pFail));
      value = pSurvival * res.intrinsicValue + pFail * salvage;
      methodDesc = 'Distressed valuation with failure probability';
    } else if (scenario === 'financial') {
      const bv = parseFloat(bookValue);
      const r = parseFloat(roe);
      if (isNaN(bv) || isNaN(r)) {
        setResult(null);
        return;
      }
      // Simple residual income model: Value = Book Value + PV of Excess Earnings
      // Excess earnings = (ROE - discountRate) × Book Value; assume perpetuity
      const excess = (r - discountRate) * bv;
      const pvExcess = excess / (discountRate - terminalGrowth);
      value = bv + pvExcess;
      methodDesc = 'Residual income valuation for financial firms';
    } else if (scenario === 'private') {
      const illiq = parseFloat(illiquidityDiscount);
      const control = parseFloat(controlPremium);
      const res = calculateDCF({ cashFlows: cf, discountRate, terminalGrowth, terminalMethod, exitMultiple, exitMetric });
      let val = res.intrinsicValue;
      if (!isNaN(illiq) && illiq > 0) val = val * (1 - illiq);
      if (!isNaN(control) && control > 0) val = val * (1 + control);
      value = val;
      methodDesc = 'Private company valuation with discounts/premia';
    }
    setResult({ value, methodDesc });
  };

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">Special Valuation Scenarios</h3>
      <p className="text-sm text-gray-600 mb-3">
        Choose a scenario below to apply a valuation approach suitable for
        distressed firms, financial service companies or private businesses.
      </p>
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Scenario</label>
        <select
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
        >
          <option value="general">General / Listed Company</option>
          <option value="distressed">Distressed Company</option>
          <option value="financial">Financial Service Firm</option>
          <option value="private">Private Company</option>
        </select>
      </div>
      {scenario === 'distressed' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Probability of Failure</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.0001"
              value={failureProb}
              onChange={(e) => setFailureProb(e.target.value)}
              placeholder="e.g. 0.30"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
            />
            <p className="text-xs text-gray-500">Expected probability the firm will default within the forecast horizon.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Salvage Value if Failure</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={salvageValue}
              onChange={(e) => setSalvageValue(e.target.value)}
              placeholder="e.g. 1000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
            />
            <p className="text-xs text-gray-500">Estimated value recoverable if the company fails.</p>
          </div>
        </div>
      )}
      {scenario === 'financial' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Book Value of Equity</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={bookValue}
              onChange={(e) => setBookValue(e.target.value)}
              placeholder="e.g. 500000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
            />
            <p className="text-xs text-gray-500">Current book value of equity.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Return on Equity (ROE)</label>
            <input
              type="number"
              min="0"
              step="0.0001"
              value={roe}
              onChange={(e) => setRoe(e.target.value)}
              placeholder="e.g. 0.15"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
            />
            <p className="text-xs text-gray-500">Expected ROE (decimal).</p>
          </div>
        </div>
      )}
      {scenario === 'private' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Illiquidity Discount</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.0001"
              value={illiquidityDiscount}
              onChange={(e) => setIlliquidityDiscount(e.target.value)}
              placeholder="e.g. 0.15"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
            />
            <p className="text-xs text-gray-500">Fractional reduction in value to account for illiquidity.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Control Premium</label>
            <input
              type="number"
              min="0"
              step="0.0001"
              value={controlPremium}
              onChange={(e) => setControlPremium(e.target.value)}
              placeholder="e.g. 0.20"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
            />
            <p className="text-xs text-gray-500">Fractional increase in value reflecting control premium.</p>
          </div>
        </div>
      )}
      <div className="mt-4 text-center">
        <button
          onClick={compute}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light"
        >
          Compute Special Valuation
        </button>
      </div>
      {result && (
        <div className="mt-4 text-sm space-y-1">
          <p><span className="font-medium">Valuation Method:</span> {result.methodDesc}</p>
          <p>
            <span className="font-medium">Intrinsic Value:</span>{' '}
            {currencySymbol}{displayValue(result.value)}
            {result.value != null && !isNaN(result.value) && (
              <span>
                {' '}({currencySymbol}{Number(result.value).toLocaleString(undefined, { maximumFractionDigits: 0 })})
              </span>
            )}
          </p>
          {baselineIntrinsicValue != null && (
            <p className="italic text-xs text-gray-500">
              Baseline DCF value: {currencySymbol}{displayValue(baselineIntrinsicValue)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}