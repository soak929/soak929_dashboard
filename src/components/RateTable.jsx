function RateTable({ rates }) {
  return (
    <section className="panel table-panel">
      <div className="section-title table-title">
        <div>
          <p className="eyebrow">Markets</p>
          <h2>환율 상세 표</h2>
        </div>
        <span className="badge">{rates.length} pairs</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Pair</th>
              <th>Rate</th>
              <th>Bid</th>
              <th>Ask</th>
              <th>Spread</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((rate) => (
              <tr key={rate.pair}>
                <td>
                  <strong>{rate.pair}</strong>
                  <span>
                    {rate.base}/{rate.target}
                  </span>
                </td>
                <td className="numeric">{formatRate(rate.rate, rate.pair)}</td>
                <td className="numeric positive-text">{formatOptionalRate(rate.bid, rate.pair)}</td>
                <td className="numeric negative-text">{formatOptionalRate(rate.ask, rate.pair)}</td>
                <td className="numeric muted-number">
                  {formatOptionalRate(Number(rate.ask) - Number(rate.bid), rate.pair)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function formatOptionalRate(value, pair) {
  return Number.isFinite(Number(value)) ? formatRate(Number(value), pair) : '-'
}

function formatRate(value, pair) {
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: pair === 'JPY/KRW' ? 4 : 2,
    maximumFractionDigits: pair === 'JPY/KRW' ? 4 : 2,
  }).format(value)
}

export default RateTable
