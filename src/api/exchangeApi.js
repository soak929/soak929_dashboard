const API_URL = 'http://localhost:8000/api/rates'

export async function getExchangeRates() {
  const response = await fetch(API_URL)

  if (!response.ok) {
    throw new Error('환율 데이터를 불러오지 못했습니다.')
  }

  return response.json()
}
