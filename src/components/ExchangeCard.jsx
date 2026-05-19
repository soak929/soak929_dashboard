function ExchangeCard({ rate, statusLabel }) {
  const spread = Number(rate.ask) - Number(rate.bid)

  return (
    <article className="exchange-card">
      <div className="card-heading">
        <div>
          <p className="pair-label">{rate.pair}</p>
          <span className="pair-subtitle">
            {rate.base} / {rate.target}
          </span>
        </div>
        <span className="badge badge-soft">{statusLabel}</span>
      </div>

      <div className="rate-summary">
        <span className="rate-label">기준 환율</span>
        <strong className="rate-value">{formatRate(rate.rate, rate.pair)}</strong>
      </div>

      <dl className="quote-list">
        <div>
          <dt>매수 환율</dt>
          <dd className="numeric positive-text">{formatOptionalRate(rate.bid, rate.pair)}</dd>
        </div>
        <div>
          <dt>매도 환율</dt>
          <dd className="numeric negative-text">{formatOptionalRate(rate.ask, rate.pair)}</dd>
        </div>
        <div>
          <dt>매수·매도 차이</dt>
          <dd className="numeric muted-number">{formatOptionalRate(spread, rate.pair)}</dd>
        </div>
      </dl>
    </article>
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

export default ExchangeCard
