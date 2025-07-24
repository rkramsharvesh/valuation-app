import { useState } from 'react';

/**
 * Corporate governance / objective notes module. Allows users to record a
 * simple checklist and narrative regarding the company's stated
 * objectives and governance quality. Based on the selections a
 * qualitative score is computed and an indicative adjustment to the
 * discount rate is suggested. This is intended as a guiding tool and not
 * a substitute for detailed governance analysis.
 */
export default function Governance({ currentDiscountRate = null }) {
  const [objectiveClear, setObjectiveClear] = useState(false);
  const [independentBoard, setIndependentBoard] = useState(false);
  const [shareholderRights, setShareholderRights] = useState(false);
  const [notes, setNotes] = useState('');

  const score = (objectiveClear ? 1 : 0) + (independentBoard ? 1 : 0) + (shareholderRights ? 1 : 0);
  const maxScore = 3;
  const governanceScore = score / maxScore;
  // Suggest an adjustment: penalize poor governance by adding up to 2% to the discount rate
  const adjustment = (1 - governanceScore) * 0.02;

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">Corporate Governance & Objectives</h3>
      <p className="text-sm text-gray-600 mb-3">
        Assess the quality of corporate governance by checking the applicable
        statements. A lower governance score may warrant a higher cost of
        capital to reflect agency risks and potential value erosion.
      </p>
      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={objectiveClear} onChange={(e) => setObjectiveClear(e.target.checked)} />
          <span className="text-sm">Company clearly states objective to maximise shareholder value</span>
        </label>
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={independentBoard} onChange={(e) => setIndependentBoard(e.target.checked)} />
          <span className="text-sm">Board is independent and exercises effective oversight</span>
        </label>
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={shareholderRights} onChange={(e) => setShareholderRights(e.target.checked)} />
          <span className="text-sm">Shareholder rights are protected (e.g. one share one vote)</span>
        </label>
        <div>
          <label className="block text-sm font-medium mb-1">Notes / Comments</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
            placeholder="Optional narrative on governance issues…"
          ></textarea>
        </div>
      </div>
      <div className="mt-4 text-sm">
        <p><span className="font-medium">Governance Score:</span> {(governanceScore * 100).toFixed(0)} / 100</p>
        <p><span className="font-medium">Suggested Discount Rate Adjustment:</span> +{(adjustment * 100).toFixed(2)}%</p>
        {currentDiscountRate != null && (
          <p className="italic text-xs text-gray-500">Adjusted discount rate would be {(currentDiscountRate + adjustment).toFixed(4)}</p>
        )}
      </div>
    </div>
  );
}