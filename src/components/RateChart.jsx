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

function RateChart({ history, isTemporary = false }) {
  const [selectedPair, setSelectedPair] = useState('USD/KRW')

  const chartData = useMemo(
    () =>
      history
        .map((entry) => {
          const rate = entry.rates.find((item) => item.pair === selectedPair)
          const numericRate = Number(rate?.rate)

          return {
            time: formatAxisDateTime(entry.fetchedAt),
            fetchedAt: entry.fetchedAt,
            rate: numericRate,
          }
        })
        .filter((entry) => Number.isFinite(entry.rate)),
    [history, selectedPair],
  )

  const yDomain = useMemo(() => getPaddedDomain(chartData), [chartData])

  return (
    <section className="panel chart-panel">
      <div className="section-title chart-title">
        <div>
          <p className="eyebrow">Trend</p>
          <h2>환율 변동 그래프</h2>
          {isTemporary && <p className="chart-note">임시 데이터 기반 그래프입니다.</p>}
        </div>

        <div className="pair-tabs" aria-label="통화쌍 선택">
          {PAIRS.map((pair) => (
            <button
              className={pair === selectedPair ? 'active' : ''}
              key={pair}
              type="button"
              onClick={() => setSelectedPair(pair)}
            >
              {pair}
            </button>
          ))}
        </div>
      </div>

      {chartData.length < 2 ? (
        <p className="chart-empty">그래프 데이터를 수집 중입니다.</p>
      ) : (
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#2b3139" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: '#707a8a', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#2b3139' }}
                minTickGap={18}
              />
              <YAxis
                domain={yDomain}
                tick={{ fill: '#707a8a', fontSize: 12 }}
                tickFormatter={(value) => formatRate(value, selectedPair)}
                tickLine={false}
                axisLine={{ stroke: '#2b3139' }}
                width={76}
              />
              <Tooltip
                contentStyle={{
                  background: '#181a20',
                  border: '1px solid #2b3139',
                  borderRadius: 8,
                  color: '#eaecef',
                }}
                formatter={(value) => [formatRate(value, selectedPair), selectedPair]}
                labelFormatter={(_, payload) =>
                  formatTooltipDateTime(payload?.[0]?.payload?.fetchedAt)
                }
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#FCD535"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#FCD535', stroke: '#181a20', strokeWidth: 1 }}
                activeDot={{ r: 5, fill: '#FCD535', stroke: '#181a20', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

function getPaddedDomain(chartData) {
  if (chartData.length === 0) {
    return ['auto', 'auto']
  }

  const values = chartData.map((entry) => entry.rate)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  const padding = range === 0 ? Math.max(Math.abs(max) * 0.001, 1) : range * 0.15

  return [min - padding, max + padding]
}

function formatAxisDateTime(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const month = padDatePart(date.getMonth() + 1)
  const day = padDatePart(date.getDate())
  const hour = padDatePart(date.getHours())
  const minute = padDatePart(date.getMinutes())

  return `${month}/${day} ${hour}:${minute}`
}

function formatTooltipDateTime(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value || ''
  }

  const year = date.getFullYear()
  const month = padDatePart(date.getMonth() + 1)
  const day = padDatePart(date.getDate())
  const hour = padDatePart(date.getHours())
  const minute = padDatePart(date.getMinutes())
  const second = padDatePart(date.getSeconds())

  return `${year}.${month}.${day} ${hour}:${minute}:${second}`
}

function padDatePart(value) {
  return String(value).padStart(2, '0')
}

function formatRate(value, pair) {
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: pair === 'JPY/KRW' ? 4 : 2,
    maximumFractionDigits: pair === 'JPY/KRW' ? 4 : 2,
  }).format(value)
}

export default RateChart
