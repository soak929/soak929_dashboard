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
              <th>기준</th>
              <th>대상</th>
              <th>환율</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((rate) => (
              <tr key={rate.pair}>
                <td>{rate.pair}</td>
                <td>{rate.base}</td>
                <td>{rate.target}</td>
                <td>{formatRate(rate.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function formatRate(value) {
  return new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: 4,
  }).format(value)
}

export default RateTable
