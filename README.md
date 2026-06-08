# Economic Insight Assistant

## Project Structure

- `frontend/`: Vite React client.
- `backend/`: Node backend scaffold for API routes.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in `frontend/.env` if the backend is not running on `http://localhost:3001`.

## Backend

```bash
cd backend
npm install
npm run dev
```

The backend starts on `http://localhost:3001` by default.

Backend endpoints:

- `GET /health`
- `POST /api/series-ids` with `{ "query": "..." }`
- `POST /api/insights` with `{ "query": "...", "series": [{ "seriesId": "...", "title": "..." }] }`

The `/api/insights` response includes `series`; each returned series item contains its own `units`, `unitsShort`, `observations`, and `insight`.

Set `GEMINI_API_KEY` and `FRED_API_KEY` in `backend/.env` before calling `/api/insights`.
