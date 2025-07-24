import { useState } from 'react';

/**
 * Reinvestment and growth module. Provides an input interface for the
 * return on invested capital (ROIC) and the reinvestment rate. The
 * fundamental growth rate is computed as ROIC × Reinvestment Rate.
 */
export default function ReinvestmentGrowth() {
  const [roic, setRoic] = useState('');
  const [reinvestment, setReinvestment] = useState('');
  const [growth, setGrowth] = useState(null);

  const compute = () => {
    const r = parseFloat(roic);
    const reinv = parseFloat(reinvestment);
    if (!isNaN(r) && !isNaN(reinv)) {
      setGrowth(r * reinv);
    } else {
      setGrowth(null);
    }
  };

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">Reinvestment Rate & Growth</h3>
      <p className="text-sm text-gray-600 mb-3">
        Estimate sustainable growth by multiplying the return on invested
        capital (ROIC) by the reinvestment rate. This is a key principle in
        Dr. Damodaran’s valuation framework.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">ROIC (decimal)</label>
          <input
            type="number"
            min="0"
            step="0.0001"
            value={roic}
            onChange={(e) => setRoic(e.target.value)}
            placeholder="e.g. 0.12"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Reinvestment Rate</label>
          <input
            type="number"
            min="0"
            step="0.0001"
            value={reinvestment}
            onChange={(e) => setReinvestment(e.target.value)}
            placeholder="e.g. 0.40"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
          />
        </div>
      </div>
      <div className="mt-4 text-center">
        <button
          onClick={compute}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light"
          disabled={!roic || !reinvestment}
        >
          Compute Growth
        </button>
      </div>
      {growth != null && (
        <div className="mt-4 text-sm">
          <p><span className="font-medium">Fundamental Growth Rate:</span> {(growth * 100).toFixed(2)}%</p>
          <p className="italic text-xs text-gray-500">Growth = ROIC × Reinvestment Rate</p>
        </div>
      )}
    </div>
  );
}