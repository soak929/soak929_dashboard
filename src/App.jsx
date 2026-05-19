import { useEffect, useState } from 'react'
import { getExchangeRates } from './api/exchangeApi'
import CurrencyConverter from './components/CurrencyConverter'
import ExchangeCard from './components/ExchangeCard'
import RateChart from './components/RateChart'
import RateTable from './components/RateTable'
import './App.css'

const REFRESH_INTERVAL_MS = 10 * 60 * 1000
const MAX_HISTORY_LENGTH = 30
const MOCK_HISTORY_LENGTH = 12
const MOCK_HISTORY_STEP_MS = 10 * 60 * 1000
const PAIR_DISPLAY_ORDER = ['USD/KRW', 'USD/JPY', 'JPY/KRW']

function App() {
  const [rates, setRates] = useState([])
  const [history, setHistory] = useState([])
  const [metadata, setMetadata] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadExchangeRates({ showLoading = false } = {}) {
      try {
        if (showLoading) {
          setIsLoading(true)
        }
        setError('')

        const data = await getExchangeRates()
        const nextRates = Array.isArray(data.rates) ? data.rates : []
        const fetchedAt = data.fetchedAt || new Date().toISOString()
        const isMockFallback = data.source === 'Mock fallback'
        const nextHistoryEntries = createHistoryEntries(nextRates, fetchedAt, isMockFallback)

        if (!isMounted) {
          return
        }

        setRates(nextRates)
        setMetadata({
          source: data.source,
          isFallback: Boolean(data.isFallback),
          fallbackReason: data.fallbackReason,
          lastUpdated: data.lastUpdated,
          fetchedAt,
          cacheExpiresAt: data.cacheExpiresAt,
        })
        setHistory((previousHistory) =>
          [
            ...(isMockFallback
              ? previousHistory
              : previousHistory.filter((entry) => !entry.isTemporary)),
            ...nextHistoryEntries,
          ].slice(-MAX_HISTORY_LENGTH),
        )
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadExchangeRates({ showLoading: true })

    // Keep the existing 10-minute backend refresh cadence.
    const intervalId = window.setInterval(loadExchangeRates, REFRESH_INTERVAL_MS)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  const displayRates = sortRatesByPreferredOrder(rates)
  const featuredRates = PAIR_DISPLAY_ORDER
    .map((pair) => rates.find((rate) => rate.pair === pair))
    .filter(Boolean)

  const updatedAt = metadata?.lastUpdated || metadata?.fetchedAt
  const statusLabel = getStatusLabel(metadata)
  const sourceLabel = getSourceLabel(metadata)
  const updatedLabel = getUpdatedLabel(metadata, updatedAt)
  const isMockData = metadata?.source === 'Mock fallback'
  const isFallback = Boolean(metadata?.isFallback)
  const dashboardTitle = !metadata || isFallback
    ? '환율 모니터링 대시보드'
    : '실시간 환율 모니터링'

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-mark" aria-hidden="true">
            EX
          </div>
          <div>
            <p className="topbar-kicker">Exchange Dashboard</p>
            <h1>환율 대시보드</h1>
          </div>

          <div className="status-badges" aria-label="데이터 상태">
            <span className="badge badge-strong">{statusLabel}</span>
            <span className="badge">{sourceLabel}</span>
            <span className="badge">{updatedLabel}</span>
          </div>
        </div>
      </header>

      <div className="dashboard">
        <section className="hero-panel" aria-labelledby="dashboard-title">
          <div className="hero-copy">
            <span className="badge badge-strong">
              {statusLabel}
            </span>
            <h2 id="dashboard-title">{dashboardTitle}</h2>
            <p>USD, JPY, KRW 환율을 한 화면에서 확인하고 변환합니다.</p>
          </div>

          <dl className="summary-meta">
            <div>
              <dt>데이터</dt>
              <dd>{sourceLabel}</dd>
            </div>
            <div>
              <dt>갱신</dt>
              <dd>{metadata?.isFallback ? 'mock' : updatedAt ? formatDateTime(updatedAt) : '-'}</dd>
            </div>
            <div>
              <dt>통화쌍</dt>
              <dd>{rates.length || '-'}</dd>
            </div>
          </dl>
        </section>

        {metadata?.isFallback && (
          <section className="status-card fallback-card" role="status">
            <strong>현재는 API 호출 제한을 고려해 임시 데이터를 표시하고 있습니다.</strong>
            {metadata.fallbackReason && (
              <span className="fallback-reason">상태: {metadata.fallbackReason}</span>
            )}
          </section>
        )}

        {isLoading && (
          <section className="status-card" role="status">
            <strong>환율 데이터를 불러오는 중입니다.</strong>
            <span>백엔드 API와 캐시 상태를 확인하고 있습니다.</span>
          </section>
        )}

        {error && (
          <section className="status-card error-card" role="alert">
            <strong>데이터 요청에 실패했습니다.</strong>
            <span>{error} 백엔드 서버가 실행 중인지 확인해 주세요.</span>
          </section>
        )}

        {!isLoading && !error && rates.length === 0 && (
          <section className="status-card" role="status">
            <strong>표시할 환율 데이터가 없습니다.</strong>
            <span>데이터가 들어오면 카드와 표가 자동으로 채워집니다.</span>
          </section>
        )}

        {!isLoading && rates.length > 0 && (
          <>
            <section className="card-grid" aria-label="주요 환율">
              {featuredRates.map((rate) => (
                <ExchangeCard key={rate.pair} rate={rate} statusLabel={statusLabel} />
              ))}
            </section>

            <section className="workspace-grid">
              <RateChart history={history} isTemporary={isMockData || isFallback} />
              <CurrencyConverter rates={displayRates} />
            </section>

            <RateTable rates={displayRates} />
          </>
        )}
      </div>
    </main>
  )
}

function createHistoryEntries(rates, fetchedAt, isMockFallback) {
  if (!isMockFallback) {
    return [
      {
        fetchedAt,
        isTemporary: false,
        label: formatHistoryLabel(fetchedAt),
        rates,
      },
    ]
  }

  const endTime = toTimestamp(fetchedAt)

  return Array.from({ length: MOCK_HISTORY_LENGTH }, (_, index) => {
    const pointTime = new Date(
      endTime - (MOCK_HISTORY_LENGTH - 1 - index) * MOCK_HISTORY_STEP_MS,
    ).toISOString()

    return {
      fetchedAt: pointTime,
      isTemporary: true,
      label: formatHistoryLabel(pointTime),
      rates: createMockChartRates(rates, index),
    }
  })
}

function createMockChartRates(rates, index) {
  return rates.map((rate, rateIndex) => {
    const currentRate = Number(rate.rate)

    if (!Number.isFinite(currentRate)) {
      return rate
    }

    const factor =
      index === MOCK_HISTORY_LENGTH - 1
        ? 1
        : 1 + Math.sin((index + 1) * (rateIndex + 1.35)) * 0.0012

    return {
      ...rate,
      rate: Number((currentRate * factor).toFixed(getRatePrecision(rate.pair))),
    }
  })
}

function getRatePrecision(pair) {
  return pair === 'JPY/KRW' ? 4 : 2
}

function toTimestamp(value) {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? Date.now() : date.getTime()
}

function formatHistoryLabel(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatDateTime(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getStatusLabel(metadata) {
  if (!metadata) {
    return '연결 중'
  }

  if (metadata?.isFallback) {
    return metadata.source === 'Mock fallback' ? 'Mock Mode' : 'Fallback Mode'
  }

  return metadata?.source === 'Alpha Vantage cache' ? 'Cache Mode' : 'API Data'
}

function getSourceLabel(metadata) {
  if (!metadata) {
    return '연결 중'
  }

  if (metadata.isFallback) {
    return '임시 데이터'
  }

  return metadata.source === 'Alpha Vantage cache' ? '캐시 데이터' : '실시간 API'
}

function getUpdatedLabel(metadata, updatedAt) {
  if (metadata?.isFallback) {
    return '마지막 갱신: mock'
  }

  return `마지막 갱신: ${updatedAt ? formatDateTime(updatedAt) : '-'}`
}

function sortRatesByPreferredOrder(rates) {
  return [...rates].sort((left, right) => {
    const leftIndex = PAIR_DISPLAY_ORDER.indexOf(left.pair)
    const rightIndex = PAIR_DISPLAY_ORDER.indexOf(right.pair)
    const normalizedLeftIndex = leftIndex === -1 ? PAIR_DISPLAY_ORDER.length : leftIndex
    const normalizedRightIndex = rightIndex === -1 ? PAIR_DISPLAY_ORDER.length : rightIndex

    if (normalizedLeftIndex !== normalizedRightIndex) {
      return normalizedLeftIndex - normalizedRightIndex
    }

    return left.pair.localeCompare(right.pair)
  })
}

export default App
