import { useMemo, useState } from 'react'
import { convertCurrency, getCurrencies } from '../utils/convert'

function CurrencyConverter({ rates }) {
  const currencies = useMemo(() => getCurrencies(rates), [rates])
  const [amount, setAmount] = useState('100')
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('KRW')

  const convertedAmount = useMemo(
    () => convertCurrency(amount, fromCurrency, toCurrency, rates),
    [amount, fromCurrency, rates, toCurrency],
  )

  return (
    <section className="panel converter-panel">
      <div className="section-title">
        <p className="eyebrow">Converter</p>
        <h2>통화 변환기</h2>
      </div>

      <div className="form-grid">
        <label>
          금액
          <input
            min="0"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>

        <div className="converter-row">
          <label>
            From
            <select
              value={fromCurrency}
              onChange={(event) => setFromCurrency(event.target.value)}
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>

          <label>
            To
            <select
              value={toCurrency}
              onChange={(event) => setToCurrency(event.target.value)}
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="conversion-result" aria-live="polite">
        <span>환산 결과</span>
        <div className="conversion-value">
          <strong className="numeric conversion-amount">{formatCurrency(convertedAmount)}</strong>
          <span className="conversion-currency">{toCurrency}</span>
        </div>
      </div>
    </section>
  )
}

function formatCurrency(value) {
  return new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: 4,
  }).format(value)
}

export default CurrencyConverter
