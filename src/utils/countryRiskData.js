/*
 * Country risk data derived from Aswath Damodaran's January/July 2025 updates.
 *
 * Each entry contains an estimated risk‑free rate (10‑year government bond yield)
 * expressed as a decimal (e.g. 0.0444 represents 4.44%) and an equity risk
 * premium (ERP) likewise expressed as a decimal.  ERP values are drawn from
 * Aswath Damodaran’s “Country Default Spreads and Risk Premiums” table (Jan 2025 update)【466489167502873†L230-L236】【466489167502873†L108-L116】.
 * Risk‑free rates correspond to the prevailing 10‑year government bond yields
 * around July 24 2025 for each country, sourced from Trading Economics. For
 * example, the US 10‑year Treasury yield was 4.44%【346878481629279†L155-L161】,
 * India’s 10‑year bond yield was 6.33%【373569302126938†L156-L162】,
 * the UK gilt yield 4.67%【827515593919405†L156-L162】, China’s yield 1.73%【966348553081878†L156-L163】,
 * Germany’s Bund yield 2.70%【578931115680369†L157-L164】, Japan’s 10‑year yield 1.60%【714808597271429†L156-L162】,
 * France’s OAT yield 3.37%【829124921251689†L154-L160】, Canada’s 10‑year yield 3.59%【648763832399909†L155-L161】,
 * Brazil’s government bond yield 14.06%【957356976474224†L156-L162】 and
 * Australia’s 10‑year yield 4.38%【456215691315044†L156-L162】.
 */

export const countryRiskData = {
  'United States': {
    riskFreeRate: 0.0444,     // US 10‑year Treasury yield ≈4.44% on Jul 24 2025【346878481629279†L155-L161】
    equityRiskPremium: 0.0433, // Equity risk premium for USA【466489167502873†L230-L236】
    countryRiskPremium: 0,       // Mature market risk premium = ERP - mature ERP (4.33%), zero for USA
    rating: 'Aaa',              // Country credit rating (Moody’s/S&P equivalent)
  },
  China: {
    riskFreeRate: 0.0173,     // China 10‑year government bond ≈1.73%【966348553081878†L156-L163】
    equityRiskPremium: 0.0527, // Equity risk premium for China【466489167502873†L88-L88】
    countryRiskPremium: 0.0527 - 0.0433,
    rating: 'A1',
  },
  India: {
    riskFreeRate: 0.0633,     // India 10‑year bond yield ≈6.33%【373569302126938†L156-L162】
    equityRiskPremium: 0.0726, // Equity risk premium for India【466489167502873†L126-L131】
    countryRiskPremium: 0.0726 - 0.0433,
    rating: 'Baa3',
  },
  'United Kingdom': {
    riskFreeRate: 0.0467,     // UK 10‑year gilt yield ≈4.67%【827515593919405†L156-L162】
    equityRiskPremium: 0.0513, // Equity risk premium for UK【466489167502873†L230-L236】
    countryRiskPremium: 0.0513 - 0.0433,
    rating: 'Aa2',
  },
  Germany: {
    riskFreeRate: 0.0270,     // Germany 10‑year Bund yield ≈2.70%【578931115680369†L157-L164】
    equityRiskPremium: 0.0433, // Equity risk premium for Germany (mature market ERP)【466489167502873†L108-L116】
    countryRiskPremium: 0.0433 - 0.0433,
    rating: 'Aaa',
  },
  Japan: {
    riskFreeRate: 0.0160,     // Japan 10‑year government bond ≈1.60%【714808597271429†L156-L162】
    equityRiskPremium: 0.0527, // Equity risk premium for Japan【466489167502873†L139-L140】
    countryRiskPremium: 0.0527 - 0.0433,
    rating: 'A1',
  },
  France: {
    riskFreeRate: 0.0337,     // France 10‑year government bond yield ≈3.37%【829124921251689†L154-L160】
    equityRiskPremium: 0.0513, // Equity risk premium for France【466489167502873†L108-L116】
    countryRiskPremium: 0.0513 - 0.0433,
    rating: 'Aa2',
  },
  Canada: {
    riskFreeRate: 0.0359,     // Canada 10‑year bond yield ≈3.59%【648763832399909†L155-L161】
    equityRiskPremium: 0.0433, // Equity risk premium for Canada (mature market)【466489167502873†L83-L83】
    countryRiskPremium: 0.0433 - 0.0433,
    rating: 'Aaa',
  },
  Brazil: {
    riskFreeRate: 0.1406,    // Brazil 10‑year bond yield ≈14.06%【957356976474224†L156-L162】
    equityRiskPremium: 0.0767, // Equity risk premium for Brazil【466489167502873†L75-L77】
    countryRiskPremium: 0.0767 - 0.0433,
    rating: 'Ba2',
  },
  Australia: {
    riskFreeRate: 0.0438,     // Australia 10‑year bond yield ≈4.38%【456215691315044†L156-L162】
    equityRiskPremium: 0.0433, // Equity risk premium for Australia (mature market)【466489167502873†L83-L83】
    countryRiskPremium: 0.0433 - 0.0433,
    rating: 'Aaa',
  },
};

/**
 * Look up risk data for a given country.
 *
 * @param {string} name The country name. Case insensitive.
 * @returns {{riskFreeRate: number, equityRiskPremium: number} | null} Object containing
 *   risk‑free rate and equity risk premium, or null if not available.
 */
export function getCountryRiskData(name) {
  if (!name) return null;
  const key = Object.keys(countryRiskData).find(
    (c) => c.toLowerCase() === name.toLowerCase(),
  );
  return key ? countryRiskData[key] : null;
}

/**
 * Retrieve a list of supported country names. Useful for building dropdowns.
 * @returns {string[]} array of country names.
 */
export function listCountries() {
  return Object.keys(countryRiskData);
}