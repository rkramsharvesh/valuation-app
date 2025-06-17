import { useState } from 'react';
import { calculateDCF } from './utils/dcfcalculator';

function App() {
  const [cashFlows, setCashFlows] = useState(["", "", "", "", ""]);
  const [discountRate, setDiscountRate] = useState("");
  const [terminalGrowth, setTerminalGrowth] = useState("");
  const [result, setResult] = useState(null);

  const handleChange = (index, value) => {
    const updated = [...cashFlows];
    updated[index] = value;
    setCashFlows(updated);
  };

  const handleSubmit = () => {
    const numericFlows = cashFlows.map(val => parseFloat(val));
    const dr = parseFloat(discountRate);
    const tg = parseFloat(terminalGrowth);

    const dcfResult = calculateDCF({
      cashFlows: numericFlows,
      discountRate: dr,
      terminalGrowth: tg
    });

    setResult(dcfResult);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>DCF Valuation</h1>

      <div>
        {cashFlows.map((val, idx) => (
          <input
            key={idx}
            type="number"
            value={val}
            placeholder={`Year ${idx + 1} CF`}
            onChange={(e) => handleChange(idx, e.target.value)}
            style={{ margin: '5px' }}
          />
        ))}
      </div>

      <div style={{ marginTop: '10px' }}>
        <input
          type="number"
          step="0.01"
          placeholder="Discount Rate (e.g. 0.12)"
          value={discountRate}
          onChange={(e) => setDiscountRate(e.target.value)}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Terminal Growth Rate (e.g. 0.03)"
          value={terminalGrowth}
          onChange={(e) => setTerminalGrowth(e.target.value)}
          style={{ marginLeft: '10px' }}
        />
      </div>

      <button onClick={handleSubmit} style={{ marginTop: '10px' }}>
        Calculate DCF
      </button>

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h2>Results</h2>
          <p><strong>Intrinsic Value:</strong> ${result.intrinsicValue.toFixed(2)}</p>
          <p><strong>Terminal Value (PV):</strong> ${result.terminalValue.toFixed(2)}</p>

          <h3>Cash Flow PVs:</h3>
          <ul>
            {result.presentValues.map((pv, idx) => (
              <li key={idx}>Year {idx + 1}: ${pv.toFixed(2)}</li>
            ))}
          </ul>

          {result.flags.length > 0 && (
            <div style={{ color: 'red' }}>
              <h4>Warnings / Flags:</h4>
              <ul>
                {result.flags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
