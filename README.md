# InsightIQ: Economy Insight Assistant

InsightIQ: Economy Insight Assistant is a React and Node app for generating dashboard-ready economic insights from FRED data.

The app flow is:

1. User enters an economic question.
2. Backend asks Gemini for relevant FRED series IDs.
3. Backend fetches annual FRED observations and series units.
4. Backend asks Gemini for an explanation for each series.
5. Frontend renders charts and saves the latest 10 completed queries in browser history.

## Project Structure

- `frontend/`: Vite React client with React Router and Recharts.
- `backend/`: Express API server for Gemini and FRED calls.

## Prerequisites

- Node.js 20 or newer
- A Gemini API key
- A FRED API key

## Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env` from `backend/.env.template`:

```bash
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
FRED_API_KEY=your_fred_api_key_here
```

Start the backend:

```bash
npm run dev
```

The backend runs at:

```txt
http://localhost:3001
```

## Frontend Setup

In a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env` from `frontend/.env.template`:

```bash
VITE_API_BASE_URL=http://localhost:3001
```

Start the frontend:

```bash
npm run dev
```

Open the local Vite URL shown in the terminal, usually:

```txt
http://localhost:5173
```

## Available Pages

- `/`: Generate a new economic insight dashboard.
- `/history`: View the latest 10 saved queries.
- `/history/:id`: View a saved query result without calling Gemini or FRED again.

History is stored in browser `localStorage`, so it is local to the user and browser.

## Backend Endpoints

### `GET /health`

Health check endpoint.

### `POST /api/series-ids`

Request:

```json
{
  "query": "What is happening with inflation?"
}
```

Response:

```json
{
  "series": [
    {
      "seriesId": "CPIAUCSL",
      "title": "Consumer Price Index for All Urban Consumers"
    }
  ]
}
```

### `POST /api/insights`

Request:

```json
{
  "query": "What is happening with inflation?",
  "series": [
    {
      "seriesId": "CPIAUCSL",
      "title": "Consumer Price Index for All Urban Consumers"
    }
  ]
}
```

Response:

```json
{
  "query": "What is happening with inflation?",
  "series": [
    {
      "seriesId": "CPIAUCSL",
      "title": "Consumer Price Index for All Urban Consumers",
      "units": "Index 1982-1984=100",
      "observations": [
        {
          "date": "2024-01-01",
          "year": "2024",
          "value": 313.689
        }
      ],
      "insight": {
        "summary": "Plain-English explanation for this series.",
        "keyTakeaways": ["Short takeaway"]
      }
    }
  ]
}
```

The backend skips FRED series IDs that do not exist. If none of the requested series can be fetched, `/api/insights` returns an error.

## Validation

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Backend syntax check:

```bash
cd ..
node --check backend/src/server.js
```
