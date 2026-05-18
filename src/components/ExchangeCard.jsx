function ExchangeCard({ rate, statusLabel }) {
  const spread = Number(rate.ask) - Number(rate.bid)

  return (
    <article className="exchange-card">
      <div className="exchange-card-main">
        <p className="pair-label">{rate.pair}</p>
        <h2>{formatRate(rate.rate, rate.pair)}</h2>
        <dl className="quote-list">
          <div>
            <dt>매수</dt>
            <dd>{formatOptionalRate(rate.bid, rate.pair)}</dd>
          </div>
          <div>
            <dt>매도</dt>
            <dd>{formatOptionalRate(rate.ask, rate.pair)}</dd>
          </div>
          <div>
            <dt>스프레드</dt>
            <dd>{formatOptionalRate(spread, rate.pair)}</dd>
          </div>
        </dl>
      </div>
      <span className="change neutral">{statusLabel}</span>
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
