import { useState } from 'react';
import { calculateDCF } from './utils/dcfcalculator';
import { fetchFinancials } from './utils/fetchFinancials';

function App() {
  const [cashFlows, setCashFlows] = useState(["", "", "", "", ""]);
  const [discountRate, setDiscountRate] = useState("");
  const [terminalGrowth, setTerminalGrowth] = useState("");
  const [result, setResult] = useState(null);
  //Selecting country  
  const [country, setCountry] = useState("");
  // Variable for fetching stock ticker
  const [ticker, setTicker] = useState("");
  const [companyData, setCompanyData] = useState(null);
  const [error, setError] = useState("");
  
  // This function uses the selected country and fetched beta to compute the discount rate.
  const handleCountrySelection = async () => {
  if (!country || !companyData) return;

  const riskData = await fetchCountryRiskData(country);

  if (riskData) {
    const beta = companyData?.profile?.beta || 1;
    const dr = (riskData.riskFreeRate / 100) + beta * (riskData.equityRiskPremium / 100);
    setDiscountRate(dr.toFixed(4));
    console.log(`Discount Rate: ${dr.toFixed(4)}`);
    } else {
    alert("Could not fetch country risk data.");
    }
  };

  
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

  const isValidInput = () => {
    const numericFlows = cashFlows.map(val => parseFloat(val));
    const dr = parseFloat(discountRate);
    const tg = parseFloat(terminalGrowth);

    return (
      numericFlows.every(cf => !isNaN(cf) && cf >= 0) &&
      dr > 0 && dr < 1 &&
      tg >= 0 && tg < dr
    );
  };
 
  // Fetch company details using ticker   
  const handleFetch = async () => {
  if (!ticker.trim()) {
    setError("Please enter a ticker symbol.");
    setCompanyData(null);
    return;
  }
  
  const data = await fetchFinancials(ticker.trim().toUpperCase());

  if (data && data.income && data.income.length > 0) {
    setCompanyData(data);
    setError("");
    console.log(data);

    //Call the country logic once both ticker + country are selected
    if (country) {
      await handleCountrySelection();
    }
  } else {
    setCompanyData(null);
    setError("Ticker not found. Please enter a valid listed company ticker.");
  }
};
  
    // Extract 5 years of free cash flows (most recent first)
    const latestFCFs = data.cashflow
      ?.slice(0, 5)
      .map(entry => entry.freeCashFlow)
      .reverse(); // optional: to display oldest first

    if (latestFCFs && latestFCFs.length === 5) {
      setCashFlows(latestFCFs.map(val => val ? val.toFixed(2) : ""));
    } else {
      console.warn("Not enough FCF data to fill 5 years.");
    }
      
   
  return (
    <div style={{ padding: '20px' }}>
      <h1>DCF Valuation</h1>

      <div>
         {cashFlows.map((val, idx) => (
          <input
            key={idx}
            type="number"
            min="0"
            step="0.01"
            value={val}
            placeholder={`Year ${idx + 1} CF`}
            onChange={(e) => handleChange(idx, e.target.value)}
            style={{ margin: '5px' }}
            required
          />
        ))}
      </div>
    
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="Enter company ticker (e.g., AAPL)"
          style={{ marginRight: '10px' }}
        />
        <button onClick={handleFetch}>Fetch Financials</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
      
        {companyData && (
      <div style={{ marginBottom: '20px' }}>
        <h2>{companyData.profile.companyName} ({companyData.profile.symbol})</h2>
        <p><strong>Sector:</strong> {companyData.profile.sector}</p>
        <p><strong>Market Cap:</strong> ${companyData.profile.mktCap.toLocaleString()}</p>
      </div>
    )}

            <div style={{ marginTop: '10px' }}>
        <input
          type="number"
          min="0.0001"
          max="0.99"
          step="0.0001"
          placeholder="Discount Rate (e.g. 0.12)"
          value={discountRate}
          onChange={(e) => setDiscountRate(e.target.value)}
          required
        />
        <input
          type="number"
          min="0"
          max={discountRate || "0.99"}
          step="0.0001"
          placeholder="Terminal Growth Rate (e.g. 0.03)"
          value={terminalGrowth}
          onChange={(e) => setTerminalGrowth(e.target.value)}
          style={{ marginLeft: '10px' }}
          required
        />
      </div>
      
      {/* This JSX renders a country selector using a dropdown + manual input fallback. */}
    
    <div style={{ marginBottom: '20px' }}>
      <label htmlFor="countrySelect"><strong>Select or type a country:</strong></label><br />
      {/* Text input with datalist for major countries */}
      <input
        list="country-list"
        id="countrySelect"
        name="countrySelect"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        placeholder="e.g., India"
        style={{ padding: '5px', marginTop: '5px', width: '300px' }}
      />

      <datalist id="country-list">
        <option value="United States" />
        <option value="China" />
        <option value="India" />
        <option value="United Kingdom" />
        <option value="Germany" />
        <option value="Japan" />
        <option value="France" />
        <option value="Canada" />
        <option value="Brazil" />
        <option value="Australia" />
      </datalist>
    </div>


      <button
        onClick={handleSubmit}
        disabled={!isValidInput()}
        style={{ marginTop: '10px' }}
      >
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
