function RateTable({ rates }) {
  return (
    <section className="panel table-panel">
      <div className="section-title">
        <p className="eyebrow">Rates</p>
        <h2>환율 목록</h2>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>통화쌍</th>
              <th>기준 환율</th>
              <th>매수 환율</th>
              <th>매도 환율</th>
              <th>스프레드</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((rate) => (
              <tr key={rate.pair}>
                <td>{rate.pair}</td>
                <td>{formatRate(rate.rate, rate.pair)}</td>
                <td>{formatOptionalRate(rate.bid, rate.pair)}</td>
                <td>{formatOptionalRate(rate.ask, rate.pair)}</td>
                <td>{formatOptionalRate(Number(rate.ask) - Number(rate.bid), rate.pair)}</td>
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
