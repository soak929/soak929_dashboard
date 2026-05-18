import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const PAIRS = ['USD/KRW', 'USD/JPY', 'JPY/KRW']

function RateChart({ history }) {
  const [selectedPair, setSelectedPair] = useState('USD/KRW')

  const chartData = useMemo(
    () =>
      history
        .map((entry) => {
          const rate = entry.rates.find((item) => item.pair === selectedPair)

          return {
            time: entry.label,
            fetchedAt: entry.fetchedAt,
            rate: rate?.rate,
          }
        })
        .filter((entry) => Number.isFinite(entry.rate)),
    [history, selectedPair],
  )

  return (
    <section className="panel chart-panel">
      <div className="section-title chart-title">
        <div>
          <p className="eyebrow">Trend</p>
          <h2>환율 변동 그래프</h2>
        </div>

        <label className="chart-select-label">
          통화쌍
          <select
            value={selectedPair}
            onChange={(event) => setSelectedPair(event.target.value)}
          >
            {PAIRS.map((pair) => (
              <option key={pair} value={pair}>
                {pair}
              </option>
            ))}
          </select>
        </label>
      </div>

      {chartData.length < 2 ? (
        <p className="chart-empty">그래프를 표시하기 위한 데이터 수집 중입니다.</p>
      ) : (
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#e8edf2" strokeDasharray="4 4" />
              <XAxis dataKey="time" tickLine={false} axisLine={false} />
              <YAxis
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => formatRate(value, selectedPair)}
                tickLine={false}
                axisLine={false}
                width={72}
              />
              <Tooltip
                formatter={(value) => [formatRate(value, selectedPair), selectedPair]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fetchedAt ?? ''}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#40798c"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

function formatRate(value, pair) {
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: pair === 'JPY/KRW' ? 4 : 2,
    maximumFractionDigits: pair === 'JPY/KRW' ? 4 : 2,
  }).format(value)
}

export default RateChart
