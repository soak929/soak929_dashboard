# 최신 환율 모니터링 및 통화 변환 대시보드

React + Vite 프론트엔드와 FastAPI 백엔드로 구성된 환율 대시보드입니다. USD, JPY, KRW 환율을 조회하고 통화 변환을 수행할 수 있으며, 환율 카드, 그래프, 매수/매도 환율, 상세 환율 표, 통화 변환기를 제공합니다.

백엔드는 Alpha Vantage Currency Exchange Rate API를 중계하며, 개발 중 API 호출량을 줄이기 위한 mock 모드와 API 실패 시 fallback/cache를 사용하는 구조를 포함합니다.

## 주요 기능

- USD/KRW, USD/JPY, JPY/KRW 환율 표시
- 기준 환율, 매수 환율, 매도 환율, 스프레드 표시
- 통화 변환 계산기
- 환율 변동 그래프
- 환율 상세 표 제공
- FastAPI 백엔드를 통한 API 중계
- Alpha Vantage Currency Exchange Rate API 연동 구조
- API rate limit 대응을 위한 mock fallback 및 cache 구조

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
USE_MOCK_API=true
```

실제 API key는 코드나 README에 작성하지 않습니다. `backend/.env` 파일은 Git에 포함하지 않는 로컬 환경변수 파일로 관리합니다.

개발 중에는 Alpha Vantage 무료 API의 요청 제한을 피하기 위해 `USE_MOCK_API=true` 사용을 권장합니다. 실제 API 연동을 테스트할 때만 아래처럼 변경합니다.

```env
USE_MOCK_API=false
```

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

Alpha Vantage 무료 API에는 요청 제한이 있습니다. 개발 중 무분별한 실제 API 호출을 막기 위해 `USE_MOCK_API=true` 모드를 제공하며, 이 모드에서는 Alpha Vantage를 호출하지 않고 mock 데이터를 사용합니다.

`USE_MOCK_API=false`로 실제 API를 사용할 때도 rate limit, 네트워크 오류, 응답 실패가 발생할 수 있습니다. 이런 상황에서도 앱이 깨지지 않도록 백엔드는 fallback 데이터를 반환할 수 있으며, 실제 API 호출에 성공한 데이터는 cache로 저장해 재사용할 수 있습니다.

환율 요청량을 줄이기 위해 `USD/KRW`, `USD/JPY`는 API에서 가져오고, `JPY/KRW`는 `USD/KRW`와 `USD/JPY` 값을 기반으로 계산할 수 있습니다.

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

필요 시 프로젝트 루트에서 아래 명령으로 프론트엔드 lint와 build를 확인할 수 있습니다.

```bash
npm.cmd run lint
npm.cmd run build
```
