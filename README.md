# 최신 환율 모니터링 및 통화 변환 대시보드

React + Vite 프론트엔드와 FastAPI 백엔드로 구성된 환율 대시보드입니다. USD, JPY, KRW 환율을 조회하고 통화 변환을 수행할 수 있으며, 환율 카드, 그래프, 매수/매도 환율, 상세 환율 표, 통화 변환기를 제공합니다.

백엔드는 Alpha Vantage Currency Exchange Rate API를 우선 사용합니다. 무료 API의 요청 제한이나 네트워크 오류가 발생해도 앱이 깨지지 않도록 마지막 성공 캐시와 mock fallback을 함께 사용합니다.

## 주요 기능

- USD/KRW, USD/JPY, JPY/KRW 환율 표시
- 기준 환율, 매수 환율, 매도 환율, 매수·매도 차이 표시
- 통화 변환 계산기
- 환율 변동 그래프
- 환율 상세 표 제공
- FastAPI 백엔드를 통한 API 중계
- Alpha Vantage Currency Exchange Rate API 연동
- API rate limit 대응을 위한 cache 및 mock fallback 구조

## 기술 스택

### Frontend

- React
- Vite
- JavaScript
- CSS
- Recharts

### Backend

- Python
- FastAPI
- Uvicorn
- python-dotenv
- requests
- httpx

### API

- Alpha Vantage Currency Exchange Rate API

## 프로젝트 구조

```text
dashboard/
├── backend/
│   ├── main.py
│   ├── exchange_service.py
│   ├── requirements.txt
│   ├── .env.example
│   └── cache/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── api/
│   ├── assets/
│   ├── components/
│   ├── utils/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── package.json
├── vite.config.js
└── README.md
```

## 환경변수 설정

`backend/.env.example`을 참고해 `backend/.env` 파일을 생성합니다.

```env
ALPHA_VANTAGE_API_KEY=your_api_key_here
USE_MOCK_API=false
```

실제 API key는 코드나 README에 작성하지 않습니다. `backend/.env` 파일은 Git에 포함하지 않는 로컬 환경변수 파일로 관리합니다.

실제 Alpha Vantage API를 사용하려면 `backend/.env`에서 `USE_MOCK_API=false`로 설정한 뒤 백엔드 서버를 재시작합니다. 이 상태에서는 백엔드가 먼저 유효한 캐시를 확인하고, 캐시가 없거나 만료된 경우 Alpha Vantage API를 호출합니다.

개발 중 API 호출량을 아끼고 싶다면 아래처럼 mock 모드를 사용할 수 있습니다.

```env
USE_MOCK_API=true
```

`USE_MOCK_API=true`일 때는 Alpha Vantage API를 호출하지 않고 mock fallback 데이터를 즉시 반환합니다.

## 실행 방법

### Backend 실행

```bash
cd backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m uvicorn main:app --reload
```

Backend API 주소:

```text
http://127.0.0.1:8000/api/rates
```

### Frontend 실행

프로젝트 루트에서 실행합니다.

```bash
npm.cmd install
npm.cmd run dev
```

Frontend 주소:

```text
http://localhost:5173/
```

## API 및 fallback 설계

`USE_MOCK_API=false`에서는 실제 Alpha Vantage API 사용을 기본 흐름으로 합니다. 다만 Alpha Vantage 무료 API에는 요청 제한이 있으므로, 실제 API 호출 성공 데이터는 `backend/cache/rates_cache.json`에 저장하고 4시간 동안 재사용합니다.

캐시가 아직 만료되지 않았다면 백엔드는 Alpha Vantage를 새로 호출하지 않고 `source: "Alpha Vantage cache"` 응답을 반환합니다. 캐시가 없거나 만료되었을 때만 실제 API 호출을 시도합니다.

실제 API 호출에 성공하면 `source: "Alpha Vantage"`, `isFallback: false`로 응답합니다. API key 누락, rate limit, 네트워크 오류, 응답 파싱 실패가 발생하면 마지막 성공 캐시를 우선 사용합니다. 마지막 성공 캐시도 없을 때만 `source: "Mock fallback"` 데이터를 반환합니다.

fallback 사유는 다음 값으로 응답에 포함됩니다.

- `api key missing`
- `rate limit`
- `network error`
- `parse error`

Alpha Vantage 호출 수를 줄이기 위해 `USD/KRW`, `USD/JPY`는 API에서 직접 가져오고, `JPY/KRW`는 두 값을 기반으로 계산합니다.

```text
JPY/KRW rate = USD/KRW rate / USD/JPY rate
JPY/KRW bid  = USD/KRW bid  / USD/JPY ask
JPY/KRW ask  = USD/KRW ask  / USD/JPY bid
```

## 향후 개선점

- 실제 API 호출량이 더 넉넉한 환율 API로 교체
- 사용자 선택 통화쌍 확대
- 기간별 그래프 필터 추가
- 실제 DB 저장 기능 추가
- 배포 환경 구성

## 주의사항

- 실제 API key를 코드나 README에 노출하지 않습니다.
- `backend/.env`는 Git에 올리지 않습니다.
- `backend/venv`, `node_modules`, `dist`는 Git에 올리지 않습니다.
- `backend/cache/rates_cache.json`은 Git에 올리지 않습니다.

## 검증 명령

백엔드 문법 검증:

```bash
python -m py_compile backend/main.py backend/exchange_service.py
```

프론트엔드 검증:

```bash
npm.cmd run lint
npm.cmd run build
```
