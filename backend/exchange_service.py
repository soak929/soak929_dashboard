import json
import os
from copy import deepcopy
from datetime import datetime, timedelta
from pathlib import Path

import httpx
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
CACHE_DIR = BASE_DIR / 'cache'
CACHE_FILE = CACHE_DIR / 'rates_cache.json'

load_dotenv(dotenv_path=BASE_DIR / '.env')

ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query'
CACHE_TTL = timedelta(hours=4)
DIRECT_PAIRS = (
    ('USD/KRW', 'USD', 'KRW'),
    ('USD/JPY', 'USD', 'JPY'),
)

_memory_cache = None


class ExchangeRateError(Exception):
    def __init__(self, fallback_reason, detail=None):
        super().__init__(detail or fallback_reason)
        self.fallback_reason = fallback_reason


def get_rates():
    global _memory_cache

    now = datetime.now()

    if _is_mock_mode():
        return _mock_fallback_response(now, 'mock api enabled')

    if _memory_cache and not _is_expired(_memory_cache, now):
        return _public_response(_memory_cache)

    file_cache = _load_file_cache()
    if file_cache and not _is_expired(file_cache, now):
        _memory_cache = _with_response_metadata(
            file_cache,
            source='Alpha Vantage cache',
            is_fallback=False,
            fallback_reason='using file cache',
        )
        return _public_response(_memory_cache)

    try:
        response = _fetch_alpha_vantage_rates(now)
        _memory_cache = response
        _save_file_cache(response)
        return _public_response(response)
    except ExchangeRateError as error:
        print('Fallback reason:', error.fallback_reason)

        last_success_cache = _memory_cache or file_cache
        if last_success_cache:
            return _public_response(
                last_success_cache,
                source='Alpha Vantage cache',
                is_fallback=True,
                fallback_reason=error.fallback_reason,
            )

        return _mock_fallback_response(now, error.fallback_reason)
    except Exception as error:
        print('Fallback reason: network error')
        print('Fallback detail:', type(error).__name__)

        last_success_cache = _memory_cache or file_cache
        if last_success_cache:
            return _public_response(
                last_success_cache,
                source='Alpha Vantage cache',
                is_fallback=True,
                fallback_reason='network error',
            )

        return _mock_fallback_response(now, 'network error')


def _is_mock_mode():
    return os.getenv('USE_MOCK_API', 'true').lower() == 'true'


def _fetch_alpha_vantage_rates(fetched_at):
    api_key = os.getenv('ALPHA_VANTAGE_API_KEY')
    print('API key loaded:', bool(api_key))

    if not api_key:
        raise ExchangeRateError('api key missing')

    rates = []
    last_updated_values = []

    with httpx.Client(timeout=10) as client:
        for pair, base, target in DIRECT_PAIRS:
            raw_data = _request_pair(client, api_key, base, target)
            rate_data = raw_data.get('Realtime Currency Exchange Rate')

            if not rate_data:
                raise ExchangeRateError(
                    'parse error',
                    f'Alpha Vantage returned no rate data for {pair}.',
                )

            rates.append(_parse_rate(pair, base, target, rate_data))
            last_updated_values.append(rate_data.get('6. Last Refreshed', ''))

    rates.append(_calculate_jpy_krw_rate(rates))

    return {
        'source': 'Alpha Vantage',
        'isFallback': False,
        'fallbackReason': None,
        'lastUpdated': max(last_updated_values),
        'fetchedAt': fetched_at.isoformat(timespec='seconds'),
        'cacheExpiresAt': (fetched_at + CACHE_TTL).isoformat(timespec='seconds'),
        'rates': rates,
    }


def _request_pair(client, api_key, base, target):
    try:
        response = client.get(
            ALPHA_VANTAGE_URL,
            params={
                'function': 'CURRENCY_EXCHANGE_RATE',
                'from_currency': base,
                'to_currency': target,
                'apikey': api_key,
            },
        )
    except httpx.RequestError as error:
        raise ExchangeRateError('network error', str(error)) from error

    print(f'Alpha Vantage status code for {base}/{target}:', response.status_code)

    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as error:
        raise ExchangeRateError('network error', str(error)) from error

    try:
        data = response.json()
    except ValueError as error:
        raise ExchangeRateError('parse error', 'Alpha Vantage returned invalid JSON.') from error

    print(f'Alpha Vantage top-level keys for {base}/{target}:', list(data.keys()))

    # Rate limit or usage guidance responses arrive with HTTP 200.
    if 'Note' in data or 'Information' in data:
        raise ExchangeRateError('rate limit')

    if 'Error Message' in data:
        raise ExchangeRateError('parse error')

    return data


def _parse_rate(pair, base, target, rate_data):
    return {
        'pair': pair,
        'base': base,
        'target': target,
        'rate': _to_float(rate_data.get('5. Exchange Rate')),
        'bid': _to_float(rate_data.get('8. Bid Price')),
        'ask': _to_float(rate_data.get('9. Ask Price')),
    }


def _calculate_jpy_krw_rate(rates):
    usd_krw = _find_rate(rates, 'USD/KRW')
    usd_jpy = _find_rate(rates, 'USD/JPY')

    if not usd_krw or not usd_jpy:
        raise ExchangeRateError('parse error', 'Cross-rate inputs are missing.')

    # JPY/KRW is derived from USD/KRW divided by USD/JPY to reduce API calls.
    return {
        'pair': 'JPY/KRW',
        'base': 'JPY',
        'target': 'KRW',
        'rate': usd_krw['rate'] / usd_jpy['rate'],
        'bid': usd_krw['bid'] / usd_jpy['ask'],
        'ask': usd_krw['ask'] / usd_jpy['bid'],
    }


def _find_rate(rates, pair):
    return next((rate for rate in rates if rate['pair'] == pair), None)


def _to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        raise ExchangeRateError('parse error', 'Alpha Vantage returned a non-numeric rate.')


def _load_file_cache():
    if not CACHE_FILE.exists():
        return None

    try:
        with CACHE_FILE.open('r', encoding='utf-8') as cache_file:
            cache = json.load(cache_file)
    except (OSError, json.JSONDecodeError):
        print('Fallback reason: parse error')
        return None

    if _is_valid_cache(cache):
        return cache

    print('Fallback reason: parse error')
    return None


def _save_file_cache(response):
    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        with CACHE_FILE.open('w', encoding='utf-8') as cache_file:
            json.dump(response, cache_file, ensure_ascii=False, indent=2)
    except OSError as error:
        print('Cache save failed:', type(error).__name__)


def _is_valid_cache(cache):
    required_keys = {
        'source',
        'isFallback',
        'fallbackReason',
        'lastUpdated',
        'fetchedAt',
        'cacheExpiresAt',
        'rates',
    }
    return required_keys.issubset(cache) and isinstance(cache['rates'], list)


def _is_expired(cache, now):
    try:
        cache_expires_at = datetime.fromisoformat(cache['cacheExpiresAt'])
    except (TypeError, ValueError):
        return True

    return now >= cache_expires_at


def _public_response(cache, source=None, is_fallback=None, fallback_reason=None):
    return {
        'source': source or cache['source'],
        'isFallback': cache['isFallback'] if is_fallback is None else is_fallback,
        'fallbackReason': cache['fallbackReason'] if fallback_reason is None else fallback_reason,
        'lastUpdated': cache['lastUpdated'],
        'fetchedAt': cache['fetchedAt'],
        'cacheExpiresAt': cache['cacheExpiresAt'],
        'rates': deepcopy(cache['rates']),
    }


def _with_response_metadata(cache, source, is_fallback, fallback_reason):
    response = deepcopy(cache)
    response['source'] = source
    response['isFallback'] = is_fallback
    response['fallbackReason'] = fallback_reason
    return response


def _mock_fallback_response(now, fallback_reason):
    return {
        'source': 'Mock fallback',
        'isFallback': True,
        'fallbackReason': fallback_reason,
        'lastUpdated': 'mock fallback',
        'fetchedAt': now.isoformat(timespec='seconds'),
        'cacheExpiresAt': (now + CACHE_TTL).isoformat(timespec='seconds'),
        'rates': [
            {
                'pair': 'USD/KRW',
                'base': 'USD',
                'target': 'KRW',
                'rate': 1491.42,
                'bid': 1491.30,
                'ask': 1491.55,
            },
            {
                'pair': 'USD/JPY',
                'base': 'USD',
                'target': 'JPY',
                'rate': 158.08,
                'bid': 158.02,
                'ask': 158.14,
            },
            {
                'pair': 'JPY/KRW',
                'base': 'JPY',
                'target': 'KRW',
                'rate': 1491.42 / 158.08,
                'bid': 1491.30 / 158.14,
                'ask': 1491.55 / 158.02,
            },
        ],
    }
