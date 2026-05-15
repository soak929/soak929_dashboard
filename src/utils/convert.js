export function getCurrencies(rates) {
  return [...new Set(rates.flatMap((rate) => [rate.base, rate.target]))].sort()
}

export function convertCurrency(amount, fromCurrency, toCurrency, rates) {
  const numericAmount = Number(amount)

  if (!Number.isFinite(numericAmount)) {
    return 0
  }

  if (fromCurrency === toCurrency) {
    return numericAmount
  }

  const directRate = getRateBetween(fromCurrency, toCurrency, rates)

  if (directRate) {
    return numericAmount * directRate
  }

  // 직접 환율이 없으면 중간 통화를 거쳐 계산합니다. 예: KRW -> JPY
  for (const middleCurrency of getCurrencies(rates)) {
    if (middleCurrency === fromCurrency || middleCurrency === toCurrency) {
      continue
    }

    const firstRate = getRateBetween(fromCurrency, middleCurrency, rates)
    const secondRate = getRateBetween(middleCurrency, toCurrency, rates)

    if (firstRate && secondRate) {
      return numericAmount * firstRate * secondRate
    }
  }

  return 0
}

function getRateBetween(fromCurrency, toCurrency, rates) {
  // 정방향 환율이 있으면 그대로 사용합니다. 예: USD -> KRW
  const directRate = rates.find(
    (rate) => rate.base === fromCurrency && rate.target === toCurrency,
  )

  if (directRate) {
    return directRate.rate
  }

  // 역방향 환율은 1 / 환율로 바꿔 계산합니다. 예: KRW -> USD
  const reverseRate = rates.find(
    (rate) => rate.base === toCurrency && rate.target === fromCurrency,
  )

  if (reverseRate) {
    return 1 / reverseRate.rate
  }

  return null
}
