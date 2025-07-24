import { useState, useEffect } from 'react';
import { syntheticRatingForCoverage } from '../utils/creditRating.js';
import { calculateDCF } from '../utils/dcfcalculator.js';

/**
 * Capital structure analysis component. Allows users to input market values
 * of debt and equity along with the cost of debt and the tax rate. It
 * computes the weighted average cost of capital (WACC) and demonstrates
 * how changing leverage alters both the cost of equity (via unlevering and
 * relevering beta) and the intrinsic value of the firm. The analysis uses
 * the provided discountRate as the current cost of equity; if risk
 * parameters and a company beta are available they are used to compute a
 * CAPM‑based cost of equity under the new leverage.
 */
export default function CapitalStructure({
  baseBeta = 1,
  riskFreeRate = 0.04,
  equityRiskPremium = 0.05,
  discountRate,
  cashFlows = [],
  terminalGrowth = 0.03,
  terminalMethod = 'gordon',
  exitMultiple,
  exitMetric,
  baselineIntrinsicValue = null,
  metrics = {},
  countryRiskPremium = 0,
  marketCap,
  currencySymbol = '',
  displayValue = (v) => v,
}) {
  const [marketDebt, setMarketDebt] = useState('');
  const [marketEquity, setMarketEquity] = useState('');
  const [costDebt, setCostDebt] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [autoInfo, setAutoInfo] = useState(null);

  // Prefill market value of equity from marketCap if provided
  useEffect(() => {
    if (marketCap && !marketEquity) {
      const val = parseFloat(marketCap);
      if (!isNaN(val)) {
        setMarketEquity(val.toFixed(2));
      }
    }
  }, [marketCap]);

  // Compute synthetic bond parameters automatically whenever metrics or risk parameters change
  useEffect(() => {
    if (!metrics || !metrics.totalDebt || !metrics.icr) {
      setAutoInfo(null);
      return;
    }
    const faceValue = metrics.totalDebt;
    const couponRateAuto = metrics.couponRate ?? 0;
    const maturity = 5; // assume 5‑year average maturity when not available
    // Determine synthetic rating and default spread from interest coverage ratio
    const { rating: syntheticRating, spread: defaultSpread } = syntheticRatingForCoverage(metrics.icr);
    // Cost of debt (pre‑tax) is risk‑free plus default spread
    const ytm = riskFreeRate + defaultSpread;
    // Price (market value) of bond: PV of coupons + face value
    const coupon = couponRateAuto * faceValue;
    const pvCoupons = couponRateAuto > 0 && ytm > 0 ? (coupon / ytm) * (1 - Math.pow(1 + ytm, -maturity)) : 0;
    const pvFace = faceValue / Math.pow(1 + ytm, maturity);
    const mv = pvCoupons + pvFace;
    // After‑tax cost of debt using marginal tax rate from metrics (if available)
    const tr = typeof metrics.taxRate === 'number' ? metrics.taxRate : 0;
    const kdAfterTax = ytm * (1 - tr);
    setAutoInfo({
      syntheticRating,
      defaultSpread,
      ytm,
      mv,
      couponRate: couponRateAuto,
      maturity,
      taxRate: tr,
      afterTaxCost: kdAfterTax,
    });
    // Prepopulate fields only if they are empty
    if (!marketDebt && mv) setMarketDebt(mv.toFixed(2));
    if (!costDebt && ytm) setCostDebt(ytm.toFixed(4));
    if (!taxRate && tr) setTaxRate(tr.toFixed(4));
  }, [metrics, riskFreeRate]);

  const computeAnalysis = () => {
    const D = parseFloat(marketDebt);
    const E = parseFloat(marketEquity);
    const kd = parseFloat(costDebt);
    const t = parseFloat(taxRate);
    if (isNaN(D) || isNaN(E) || isNaN(kd) || isNaN(t) || D < 0 || E < 0) {
      setAnalysis(null);
      return;
    }
    const total = D + E;
    const Wd = total > 0 ? D / total : 0;
    const We = total > 0 ? E / total : 0;
    // Unlevered beta and relevered beta using baseBeta from company profile
    const unleveredBeta = baseBeta / (1 + (1 - t) * (D / E));
    const releveredBeta = unleveredBeta * (1 + (1 - t) * (D / E));
    // Cost of equity using CAPM under new leverage
    const costEquityCAPM = riskFreeRate + releveredBeta * equityRiskPremium;
    // WACC using provided discountRate as cost of equity, or CAPM
    const waccUsingInputEquity = Wd * kd * (1 - t) + We * discountRate;
    const waccUsingCAPM = Wd * kd * (1 - t) + We * costEquityCAPM;
    // Compute intrinsic value under each WACC
    const resultInput = calculateDCF({
      cashFlows: cashFlows.map((v) => parseFloat(v)),
      discountRate: waccUsingInputEquity,
      terminalGrowth,
      terminalMethod,
      exitMultiple,
      exitMetric,
    });
    const resultCAPM = calculateDCF({
      cashFlows: cashFlows.map((v) => parseFloat(v)),
      discountRate: waccUsingCAPM,
      terminalGrowth,
      terminalMethod,
      exitMultiple,
      exitMetric,
    });
    setAnalysis({
      Wd,
      We,
      unleveredBeta,
      releveredBeta,
      costEquityCAPM,
      waccUsingInputEquity,
      waccUsingCAPM,
      intrinsicInput: resultInput.intrinsicValue,
      intrinsicCAPM: resultCAPM.intrinsicValue,
    });
  };

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">Capital Structure Analysis</h3>
      <p className="text-sm text-gray-600 mb-3">
        Input market values of debt and equity along with cost of debt and tax
        rate to compute WACC and illustrate how leverage impacts cost of
        capital. Beta is unlevered and relevered using the Modigliani–Miller
        approach.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Market Value of Debt</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={marketDebt}
            onChange={(e) => setMarketDebt(e.target.value)}
            placeholder={autoInfo ? autoInfo.mv.toFixed(2) : 'e.g. 500000000'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
          />
          <p className="text-xs text-gray-500">
            {autoInfo
              ? `Estimated using a synthetic bond model (coupon ${(autoInfo.couponRate * 100).toFixed(2)}%, maturity ${autoInfo.maturity}y). Override if you have market data.`
              : 'Enter total market value of debt (e.g. bonds outstanding).'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Market Value of Equity</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={marketEquity}
            onChange={(e) => setMarketEquity(e.target.value)}
            placeholder={marketCap ? parseFloat(marketCap).toFixed(2) : 'auto'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
          />
          <p className="text-xs text-gray-500">
            Auto‑fetched from the company’s current market cap; override if you have a more precise value.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cost of Debt (as decimal)</label>
          <input
            type="number"
            min="0"
            step="0.0001"
            value={costDebt}
            onChange={(e) => setCostDebt(e.target.value)}
            placeholder={autoInfo ? autoInfo.ytm.toFixed(4) : 'e.g. 0.05'}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
          />
          <p className="text-xs text-gray-500">
            {autoInfo
              ? 'Estimated YTM based on risk‑free rate plus synthetic default spread. Override if you have a more precise yield.'
              : 'Annual pre‑tax cost of debt (e.g. 0.05 = 5%).'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Corporate Tax Rate</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.0001"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            placeholder={autoInfo && typeof autoInfo.taxRate === 'number' ? autoInfo.taxRate.toFixed(4) : 'e.g. 0.30'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
          />
          <p className="text-xs text-gray-500">
            {autoInfo
              ? 'Computed from recent income statement (tax expense / pre‑tax income). Override to use statutory tax rate.'
              : 'Marginal corporate tax rate (0 to 1).'}
          </p>
        </div>
      </div>
      {/* Show automatic rating and spreads */}
      {autoInfo && (
        <div className="mt-2 text-sm text-gray-600">
          <p>
            <span className="font-medium">Synthetic Rating:</span> {autoInfo.syntheticRating} •
            Default Spread: {(autoInfo.defaultSpread * 100).toFixed(2)}% • YTM: {(autoInfo.ytm * 100).toFixed(2)}%
          </p>
        </div>
      )}
      <div className="mt-4 text-center">
        <button
          onClick={computeAnalysis}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light disabled:opacity-50"
          disabled={!marketDebt || !marketEquity || !costDebt || !taxRate}
        >
          Compute WACC & Beta
        </button>
      </div>
      {analysis && (
        <div className="mt-4 space-y-2 text-sm">
          <p><span className="font-medium">Debt Weight (Wd):</span> {analysis.Wd.toFixed(2)}</p>
          <p><span className="font-medium">Equity Weight (We):</span> {analysis.We.toFixed(2)}</p>
          <p><span className="font-medium">Unlevered Beta:</span> {analysis.unleveredBeta.toFixed(2)}</p>
          <p><span className="font-medium">Relevered Beta:</span> {analysis.releveredBeta.toFixed(2)}</p>
          <p className="text-xs italic text-gray-500">β<sub>U</sub> = β<sub>L</sub> / (1 + (1 - t)·D/E), β<sub>L</sub> = β<sub>U</sub>(1 + (1 - t)·D/E)</p>
          <p><span className="font-medium">Cost of Equity (CAPM):</span> {(analysis.costEquityCAPM * 100).toFixed(2)}%</p>
          <p><span className="font-medium">WACC (using input equity cost):</span> {(analysis.waccUsingInputEquity * 100).toFixed(2)}%</p>
          <p><span className="font-medium">WACC (using CAPM equity cost):</span> {(analysis.waccUsingCAPM * 100).toFixed(2)}%</p>
          {baselineIntrinsicValue != null && (
            <>
              <p>
                <span className="font-medium">Intrinsic Value @ WACC (input equity cost):</span>{' '}
                {currencySymbol}{displayValue(analysis.intrinsicInput)}
              </p>
              <p>
                <span className="font-medium">Intrinsic Value @ WACC (CAPM equity cost):</span>{' '}
                {currencySymbol}{displayValue(analysis.intrinsicCAPM)}
              </p>
              <p className="italic text-xs text-gray-500">
                Compare against baseline intrinsic value of {currencySymbol}{displayValue(baselineIntrinsicValue)}
              </p>
            </>
          )}
          {autoInfo && (
            <>
              <p><span className="font-medium">Synthetic Bond Rating:</span> {autoInfo.syntheticRating}</p>
              <p><span className="font-medium">Default Spread:</span> {(autoInfo.defaultSpread * 100).toFixed(2)}%</p>
              <p><span className="font-medium">YTM (pre‑tax cost of debt):</span> {(autoInfo.ytm * 100).toFixed(2)}%</p>
              <p><span className="font-medium">Cost of Debt (after tax):</span> {(autoInfo.afterTaxCost * 100).toFixed(2)}%</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}