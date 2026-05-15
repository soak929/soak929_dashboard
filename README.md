# Exchange Rate Dashboard

React + Vite 프론트엔드와 FastAPI 백엔드로 구성된 환율 대시보드입니다.

프론트엔드는 `http://localhost:8000/api/rates`만 호출하며, Alpha Vantage API key는 백엔드의 `backend/.env`에서만 읽습니다. 백엔드는 외부 API 호출 결과를 메모리에 4시간 동안 캐시하고, 프론트엔드는 10분마다 백엔드 데이터를 다시 확인합니다.

## Alpha Vantage API key 설정

`backend/.env.example`을 참고해 `backend/.env` 파일을 만들고 API key를 입력합니다. 실제 API key 값은 코드나 문서에 넣지 않습니다.

```env
ALPHA_VANTAGE_API_KEY=your_api_key_here
USE_MOCK_API=true
```

개발 중에는 Alpha Vantage 무료 API 호출 수를 아끼기 위해 `USE_MOCK_API=true`로 둡니다. 이 값이면 백엔드는 Alpha Vantage를 호출하지 않고 mock 데이터를 반환합니다.

실제 API 연동을 테스트할 때만 아래처럼 바꿉니다.

```env
USE_MOCK_API=false
```

API key가 없거나 Alpha Vantage 호출 실패, rate limit, 네트워크 오류가 발생하면 백엔드는 앱이 깨지지 않도록 마지막 성공 캐시를 먼저 사용합니다. 마지막 성공 캐시도 없을 때만 mock fallback 데이터를 반환합니다.

## 캐시 동작

백엔드는 마지막 성공 데이터를 `backend/cache/rates_cache.json`에 저장합니다. 서버를 재시작해도 이 파일이 있고 `cacheExpiresAt`이 지나지 않았다면 Alpha Vantage를 다시 호출하지 않고 파일 캐시를 반환합니다.

Alpha Vantage 호출 수를 줄이기 위해 백엔드는 `USD/KRW`, `USD/JPY`만 직접 요청하고, `JPY/KRW`는 `USD/KRW / USD/JPY`로 계산합니다.

## 백엔드 실행

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

백엔드 주소:

```text
http://localhost:8000/api/rates
```

## 프론트엔드 실행

프로젝트 루트에서 실행합니다.

```bash
npm.cmd install
npm.cmd run dev
```

프론트엔드 개발 서버:

```text
http://localhost:5173
```

## 검증 명령

```bash
npm.cmd run lint
npm.cmd run build
```
