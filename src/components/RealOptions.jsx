import { useState } from 'react';
import { blackScholesCall, blackScholesPut } from '../utils/optionPricing.js';

/**
 * Real options module. Provides simple valuation tools for common types of
 * flexibility such as the option to delay (call), abandon (put) or expand
 * (call). Users can specify the underlying project value, exercise cost
 * (e.g. investment required), volatility and time horizon. Results are
 * displayed using the Black–Scholes model assuming continuous compounding.
 */
export default function RealOptions({ riskFreeRate = 0.04 }) {
  const [optionType, setOptionType] = useState('delay');
  const [underlying, setUnderlying] = useState('');
  const [exercise, setExercise] = useState('');
  const [volatility, setVolatility] = useState('');
  const [years, setYears] = useState('');
  const [result, setResult] = useState(null);

  const handleCompute = () => {
    const S = parseFloat(underlying);
    const K = parseFloat(exercise);
    const sigma = parseFloat(volatility);
    const T = parseFloat(years);
    const r = parseFloat(riskFreeRate);
    if (isNaN(S) || isNaN(K) || isNaN(sigma) || isNaN(T) || S <= 0 || K <= 0 || sigma <= 0 || T <= 0) {
      setResult(null);
      return;
    }
    let value = 0;
    if (optionType === 'abandon') {
      value = blackScholesPut(S, K, r, sigma, T);
    } else {
      // delay and expand are modeled as call options
      value = blackScholesCall(S, K, r, sigma, T);
    }
    setResult(value);
  };

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">Real Options Valuation</h3>
      <p className="text-sm text-gray-600 mb-3">
        Assess managerial flexibility by valuing options to delay, abandon or
        expand a project. This module uses the Black–Scholes framework and
        assumes the underlying project value behaves like a financial asset.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Option Type</label>
          <select
            value={optionType}
            onChange={(e) => setOptionType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
          >
            <option value="delay">Delay (Call)</option>
            <option value="abandon">Abandon (Put)</option>
            <option value="expand">Expand (Call)</option>
          </select>
        </div>
        <div></div>
        <div>
          <label className="block text-sm font-medium mb-1">Underlying Project Value (S)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={underlying}
            onChange={(e) => setUnderlying(e.target.value)}
            placeholder="e.g. 1000000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
          />
          <p className="text-xs text-gray-500">Present value of expected cash inflows from the project.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Exercise Price (K)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            placeholder="e.g. 800000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
          />
          <p className="text-xs text-gray-500">Cost to invest, expand or salvage value in case of abandonment.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Volatility (σ)</label>
          <input
            type="number"
            min="0"
            step="0.0001"
            value={volatility}
            onChange={(e) => setVolatility(e.target.value)}
            placeholder="e.g. 0.30"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
          />
          <p className="text-xs text-gray-500">Standard deviation of project value (0.2 = 20%).</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Time to Expiration (Years)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            placeholder="e.g. 2"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
          />
        </div>
      </div>
      <div className="mt-4 text-center">
        <button
          onClick={handleCompute}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light"
          disabled={!underlying || !exercise || !volatility || !years}
        >
          Value Option
        </button>
      </div>
      {result != null && (
        <div className="mt-4 text-sm">
          <p><span className="font-medium">Option Value:</span> {result.toFixed(2)}</p>
          <p className="italic text-xs text-gray-500">Positive option values can justify waiting, abandoning or expanding even if the NPV of the base project is negative.</p>
        </div>
      )}
    </div>
  );
}