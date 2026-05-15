function ExchangeCard({ rate }) {
  return (
    <article className="exchange-card">
      <div>
        <p className="pair-label">{rate.pair}</p>
        <h2>{formatRate(rate.rate)}</h2>
      </div>
      <span className="change neutral">Live</span>
    </article>
  )
}

function formatRate(value) {
  return new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: value >= 100 ? 2 : 4,
  }).format(value)
}

export default ExchangeCard
