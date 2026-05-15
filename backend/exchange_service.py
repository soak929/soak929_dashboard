import os
from copy import deepcopy
from datetime import datetime, timedelta

import httpx
from dotenv import load_dotenv

load_dotenv()

ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query'
CACHE_TTL = timedelta(hours=4)
CURRENCY_PAIRS = (
    ('USD/KRW', 'USD', 'KRW'),
    ('USD/JPY', 'USD', 'JPY'),
    ('JPY/KRW', 'JPY', 'KRW'),
)

_cache = None


def get_rates():
    global _cache

    now = datetime.now()

    if _cache and now < _cache['expires_at']:
        return _to_public_response(_cache)

    try:
        response = _fetch_alpha_vantage_rates(now)
        _cache = response
        return _to_public_response(_cache)
    except Exception:
        if _cache:
            return _to_public_response(_cache)

        return _mock_fallback_response(now)


def _fetch_alpha_vantage_rates(fetched_at):
    api_key = os.getenv('ALPHA_VANTAGE_API_KEY')

    if not api_key:
        raise RuntimeError('ALPHA_VANTAGE_API_KEY is not configured.')

    rates = []
    last_updated_values = []

    with httpx.Client(timeout=10) as client:
        for pair, base, target in CURRENCY_PAIRS:
            raw_data = _request_pair(client, api_key, base, target)
            rate_data = raw_data.get('Realtime Currency Exchange Rate')

            if not rate_data:
                raise RuntimeError(f'Alpha Vantage returned no rate data for {pair}.')

            rates.append(
                {
                    'pair': pair,
                    'base': base,
                    'target': target,
                    'rate': _to_float(rate_data.get('5. Exchange Rate')),
                    'bid': _to_float(rate_data.get('8. Bid Price')),
                    'ask': _to_float(rate_data.get('9. Ask Price')),
                }
            )
            last_updated_values.append(rate_data.get('6. Last Refreshed', ''))

    return {
        'source': 'Alpha Vantage',
        'isFallback': False,
        'lastUpdated': max(last_updated_values),
        'fetched_at': fetched_at,
        'expires_at': fetched_at + CACHE_TTL,
        'rates': rates,
    }


def _request_pair(client, api_key, base, target):
    response = client.get(
        ALPHA_VANTAGE_URL,
        params={
            'function': 'CURRENCY_EXCHANGE_RATE',
            'from_currency': base,
            'to_currency': target,
            'apikey': api_key,
        },
    )
    response.raise_for_status()
    data = response.json()

    # Rate limit or invalid-key responses arrive as a successful HTTP response.
    if 'Note' in data or 'Information' in data or 'Error Message' in data:
        raise RuntimeError('Alpha Vantage did not return usable exchange data.')

    return data


def _to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        raise RuntimeError('Alpha Vantage returned a non-numeric rate.')


def _to_public_response(cache):
    return {
        'source': cache['source'],
        'isFallback': cache['isFallback'],
        'lastUpdated': cache['lastUpdated'],
        'fetchedAt': cache['fetched_at'].isoformat(timespec='seconds'),
        'cacheExpiresAt': cache['expires_at'].isoformat(timespec='seconds'),
        'rates': deepcopy(cache['rates']),
    }


def _mock_fallback_response(now):
    return {
        'source': 'Alpha Vantage',
        'isFallback': True,
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
                'rate': 9.43,
                'bid': 9.41,
                'ask': 9.45,
            },
        ],
    }
