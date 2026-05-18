import { useEffect, useState } from 'react'
import { getExchangeRates } from './api/exchangeApi'
import CurrencyConverter from './components/CurrencyConverter'
import ExchangeCard from './components/ExchangeCard'
import RateChart from './components/RateChart'
import RateTable from './components/RateTable'
import './App.css'

const REFRESH_INTERVAL_MS = 10 * 60 * 1000
const MAX_HISTORY_LENGTH = 30

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
            ...previousHistory,
            {
              fetchedAt,
              label: formatHistoryLabel(fetchedAt),
              rates: nextRates,
            },
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

    // 화면은 10분마다 백엔드 캐시 데이터를 다시 확인합니다.
    const intervalId = window.setInterval(loadExchangeRates, REFRESH_INTERVAL_MS)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  const featuredPairs = ['USD/KRW', 'JPY/KRW', 'USD/JPY']
  const featuredRates = featuredPairs
    .map((pair) => rates.find((rate) => rate.pair === pair))
    .filter(Boolean)

  const updatedAt = metadata?.lastUpdated || metadata?.fetchedAt
  const statusLabel = getStatusLabel(metadata)

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Exchange dashboard</p>
          <h1>환율 대시보드</h1>
        </div>
        <p className="last-updated">
          {updatedAt ? `데이터 기준: ${updatedAt}` : '환율 데이터 준비 중'}
        </p>
      </header>

      {metadata?.isFallback && (
        <p className="status-message fallback-message">
          임시 환율 데이터를 표시하고 있습니다.
          {metadata.fallbackReason ? ` 사유: ${metadata.fallbackReason}` : ''}
        </p>
      )}

      {isLoading && <p className="status-message">환율 데이터를 불러오는 중입니다.</p>}

      {error && (
        <p className="status-message error-message">
          {error} 백엔드 서버가 실행 중인지 확인해 주세요.
        </p>
      )}

      {!isLoading && !error && rates.length === 0 && (
        <p className="status-message">표시할 환율 데이터가 없습니다.</p>
      )}

      {!isLoading && rates.length > 0 && (
        <>
          <section className="card-grid" aria-label="주요 환율">
            {featuredRates.map((rate) => (
              <ExchangeCard key={rate.pair} rate={rate} statusLabel={statusLabel} />
            ))}
          </section>

          <RateChart history={history} />

          <section className="content-grid">
            <CurrencyConverter rates={rates} />
            <RateTable rates={rates} />
          </section>
        </>
      )}
    </main>
  )
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

function getStatusLabel(metadata) {
  if (metadata?.isFallback) {
    return metadata.source === 'Mock fallback' ? 'Mock' : 'Fallback'
  }

  return metadata?.source === 'Alpha Vantage cache' ? 'Cache' : 'API'
}

export default App
