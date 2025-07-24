import { useState, useEffect } from 'react';

/**
 * Industry benchmarking module. Allows the user to compare their
 * company’s key financial metrics against industry averages. You can
 * enter metrics such as return on invested capital (ROIC), operating
 * margin and revenue growth for both the company and the industry.
 * The component computes differences and highlights whether the
 * company is outperforming or underperforming. This mirrors the
 * benchmarking Dr. Damodaran often performs when valuing firms.
 */
export default function IndustryBenchmarking({ ticker = '' }) {
  const [companyMetrics, setCompanyMetrics] = useState({
    roic: '',
    margin: '',
    growth: '',
  });
  const [industryMetrics, setIndustryMetrics] = useState({
    roic: '',
    margin: '',
    growth: '',
  });
  const [peerList, setPeerList] = useState([]);
  const [loading, setLoading] = useState(false);
  const metrics = ['roic', 'margin', 'growth'];
  const labels = {
    roic: 'ROIC',
    margin: 'Operating Margin',
    growth: 'Revenue Growth',
  };

  // Compute differences between company and industry
  const differences = {};
  metrics.forEach((key) => {
    const comp = parseFloat(companyMetrics[key]);
    const ind = parseFloat(industryMetrics[key]);
    if (!isNaN(comp) && !isNaN(ind)) {
      differences[key] = comp - ind;
    } else {
      differences[key] = null;
    }
  });

  // Fetch company ratios and peers when ticker changes
  useEffect(() => {
    async function fetchBenchmark() {
      if (!ticker) {
        setCompanyMetrics({ roic: '', margin: '', growth: '' });
        setIndustryMetrics({ roic: '', margin: '', growth: '' });
        setPeerList([]);
        return;
      }
      setLoading(true);
      try {
        const API_KEY = 'ZWomosa9flSltWN1qqgfNfsqAXyxgsLl';
        const base = 'https://financialmodelingprep.com/api/v3';
        // Fetch company ratios
        const ratioRes = await fetch(`${base}/ratios-ttm/${ticker}?apikey=${API_KEY}`);
        const ratioData = await ratioRes.json();
        const ratios = ratioData[0] ?? {};
        const compRoic = parseFloat(ratios.returnOnCapitalEmployed);
        const compMargin = parseFloat(ratios.operatingProfitMargin);
        const compGrowth = parseFloat(ratios.revenueGrowth);
        setCompanyMetrics({
          roic: !isNaN(compRoic) ? compRoic.toFixed(4) : '',
          margin: !isNaN(compMargin) ? compMargin.toFixed(4) : '',
          growth: !isNaN(compGrowth) ? compGrowth.toFixed(4) : '',
        });
        // Fetch peers list
        const peerRes = await fetch(`${base}/stock_peers?symbol=${ticker}&apikey=${API_KEY}`);
        const peerData = await peerRes.json();
        // peerData may be an object with peersList property or an array of symbols
        let peers = [];
        if (Array.isArray(peerData)) {
          peers = peerData;
        } else if (peerData && peerData.peersList) {
          peers = peerData.peersList;
        }
        // Remove the company itself and limit to 5 peers
        peers = peers.filter((s) => s && s.toUpperCase() !== ticker.toUpperCase()).slice(0, 5);
        // For each peer fetch ratios
        let roicSum = 0;
        let marginSum = 0;
        let growthSum = 0;
        let count = 0;
        const usedPeers = [];
        for (const sym of peers) {
          try {
            const rRes = await fetch(`${base}/ratios-ttm/${sym}?apikey=${API_KEY}`);
            const rData = await rRes.json();
            const peerRatio = rData[0] ?? {};
            const pRoic = parseFloat(peerRatio.returnOnCapitalEmployed);
            const pMargin = parseFloat(peerRatio.operatingProfitMargin);
            const pGrowth = parseFloat(peerRatio.revenueGrowth);
            if (!isNaN(pRoic)) {
              roicSum += pRoic;
            }
            if (!isNaN(pMargin)) {
              marginSum += pMargin;
            }
            if (!isNaN(pGrowth)) {
              growthSum += pGrowth;
            }
            usedPeers.push(sym);
            count++;
          } catch (err) {
            console.error('Error fetching ratios for peer', sym, err);
          }
        }
        if (count > 0) {
          const avgRoic = (roicSum / count).toFixed(4);
          const avgMargin = (marginSum / count).toFixed(4);
          const avgGrowth = (growthSum / count).toFixed(4);
          setIndustryMetrics({ roic: avgRoic, margin: avgMargin, growth: avgGrowth });
          setPeerList(usedPeers);
        } else {
          setIndustryMetrics({ roic: '', margin: '', growth: '' });
          setPeerList([]);
        }
      } catch (err) {
        console.error('Error fetching industry benchmarking data', err);
        setCompanyMetrics({ roic: '', margin: '', growth: '' });
        setIndustryMetrics({ roic: '', margin: '', growth: '' });
        setPeerList([]);
      }
      setLoading(false);
    }
    fetchBenchmark();
  }, [ticker]);

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">Industry Benchmarking</h3>
      <p className="text-sm text-gray-600 mb-3">
        Compare your company’s performance with a peer group. Positive differences indicate the company is outperforming the peer average, while negative differences suggest underperformance.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((key) => (
          <div key={key} className="space-y-2">
            <div>
              <label className="block text-sm font-medium mb-1">{labels[key]} – Company (decimal)</label>
              <input
                type="number"
                step="0.0001"
                value={companyMetrics[key]}
                onChange={(e) => setCompanyMetrics({ ...companyMetrics, [key]: e.target.value })}
                placeholder="e.g. 0.15"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{labels[key]} – Peer Average (decimal)</label>
              <input
                type="number"
                step="0.0001"
                value={industryMetrics[key]}
                onChange={(e) => setIndustryMetrics({ ...industryMetrics, [key]: e.target.value })}
                placeholder="e.g. 0.10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-light focus:border-primary-dark"
              />
            </div>
            {differences[key] != null && (
              <p className="text-sm mt-1">
                <span className="font-medium">Difference:</span> {(differences[key] * 100).toFixed(2)}%
                {differences[key] > 0 ? ' (Above peers)' : differences[key] < 0 ? ' (Below peers)' : ''}
              </p>
            )}
          </div>
        ))}
      </div>
      {loading && (
        <p className="text-xs text-gray-500 mt-2">Fetching peer data…</p>
      )}
      {peerList.length > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          Peer group used: {peerList.join(', ')}
        </p>
      )}
      {peerList.length > 0 && (
        <div className="mt-3 text-sm text-gray-700 space-y-1">
          <p><span className="font-medium">Peer Averages:</span> ROIC {industryMetrics.roic ? (parseFloat(industryMetrics.roic) * 100).toFixed(2) + '%' : 'N/A'}, Operating Margin {industryMetrics.margin ? (parseFloat(industryMetrics.margin) * 100).toFixed(2) + '%' : 'N/A'}, Revenue Growth {industryMetrics.growth ? (parseFloat(industryMetrics.growth) * 100).toFixed(2) + '%' : 'N/A'}</p>
          <p><span className="font-medium">Company vs Peers:</span> ROIC {differences.roic != null ? (differences.roic * 100).toFixed(2) + '%' : 'N/A'}, Operating Margin {differences.margin != null ? (differences.margin * 100).toFixed(2) + '%' : 'N/A'}, Revenue Growth {differences.growth != null ? (differences.growth * 100).toFixed(2) + '%' : 'N/A'}</p>
        </div>
      )}
    </div>
  );
}