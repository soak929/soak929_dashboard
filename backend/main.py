from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from exchange_service import get_rates

app = FastAPI(title='Exchange Rate Dashboard API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173'],
    allow_credentials=True,
    allow_methods=['GET'],
    allow_headers=['*'],
)


@app.get('/api/rates')
def read_rates():
    return get_rates()
