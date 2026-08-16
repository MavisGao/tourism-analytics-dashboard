# Tourism Analytics Dashboard

An interactive portfolio dashboard for exploring tourism trends, visitor spending, hotel occupancy, and source-market performance.

## Current status

This repository contains a deployed frontend and the first backend milestone. The UI still uses clearly labeled sample data while the API deployment and public-data ingestion pipeline are under development.

**Live demo:** https://tourism-analytics-dashboard-ten.vercel.app/

## Features

- Responsive KPI overview for visitor volume, spending, average stay, and hotel occupancy
- Interactive region and year controls
- Searchable source-market table
- Monthly visitor trend visualization
- Accessible labels and mobile-friendly layout
- Django REST API with market, year, region, and text filters
- PostgreSQL-ready database configuration with a local SQLite fallback
- Backend API tests

## Tech stack

- React
- TypeScript
- Vite
- CSS
- Django
- Django REST Framework
- PostgreSQL (configured through `DATABASE_URL`)

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API will be available at:

- `GET /api/health/`
- `GET /api/markets/`
- `GET /api/markets/?year=2026&region=Europe&search=Germany`

SQLite is used when `DATABASE_URL` is not set. Copy `backend/.env.example` and provide a PostgreSQL connection string when running against PostgreSQL.

Run backend tests with:

```bash
cd backend
python manage.py test
```

## Build

```bash
npm run build
```

## Roadmap

- Deploy the Django REST Framework API
- Load documented public tourism datasets into PostgreSQL
- Connect the React frontend to the deployed API
- Replace sample values with documented public datasets
- Add frontend component tests
- Containerize the application with Docker
- Add continuous integration and public deployment

## Data note

All dashboard values in the current version are demonstration data. They do not represent official Philadelphia tourism statistics.
