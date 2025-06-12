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

    if (numericFlows.some(isNaN) || isNaN(dr) || isNaN(tg)) {
      alert("Please enter valid numeric values.");
      return;
    }

    const output = calculateDCF({
      cashFlows: numericFlows,
      discountRate: dr,
      terminalGrowth: tg,
    });

    setResult(output);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>DCF Valuation Calculator</h1>

      <h3>Enter Free Cash Flows (5 years)</h3>
      {cashFlows.map((val, idx) => (
        <input
          key={idx}
          type="number"
          placeholder={`Year ${idx + 1}`}
          value={val}
          onChange={(e) => handleChange(idx, e.target.value)}
          style={{ display: 'block', marginBottom: '10px', width: '100%' }}
        />
      ))}

      <h3>Discount Rate (e.g. 0.12)</h3>
      <input
        type="number"
        value={discountRate}
        onChange={(e) => setDiscountRate(e.target.value)}
        placeholder="Discount Rate"
        step="0.00001"
        style={{ display: 'block', marginBottom: '10px', width: '100%' }}
      />

      <h3>Terminal Growth Rate (e.g. 0.03)</h3>
      <input
        type="number"
        value={terminalGrowth}
        onChange={(e) => setTerminalGrowth(e.target.value)}
        placeholder="Terminal Growth"
        step="0.00001"
        style={{ display: 'block', marginBottom: '20px', width: '100%' }}
      />

      <button onClick={handleSubmit} style={{ padding: '10px 20px', fontSize: '16px' }}>
        Calculate DCF
      </button>

      {result && (
        <div style={{ marginTop: '30px' }}>
          <h2>Results:</h2>
          <p><strong>NPV of Cash Flows:</strong> {result.npv}</p>
          <p><strong>Terminal Value (Discounted):</strong> {result.terminalValue}</p>
          <p><strong>Total DCF Value:</strong> {result.dcfValue}</p>
        </div>
      )}
    </div>
  ); // ← This was missing
}

export default App;
