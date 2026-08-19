# Tourism Analytics Dashboard

An interactive portfolio dashboard for exploring international tourism arrivals and receipts by country, region, and year.

## Current status

The React frontend now consumes a paginated Django REST API. A reproducible management command imports World Bank tourism indicators into a PostgreSQL-ready data model. Cloud database and backend deployment are the next milestone.

**Live demo:** https://tourism-analytics-dashboard-ten.vercel.app/

## Features

- Responsive KPI overview for reported arrivals, tourism receipts, and country coverage
- Interactive region and year controls
- Searchable source-market table
- Monthly visitor trend visualization
- Accessible labels and mobile-friendly layout
- Django REST API with market, year, region, and text filters
- PostgreSQL-ready persistence with a local SQLite fallback
- Reproducible World Bank API ingestion command
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

Import the public dataset and start the API:

```bash
python manage.py import_world_bank --start-year 2015 --end-year 2023
python manage.py runserver
```

The API will be available at:

- `GET /api/health/`
- `GET /api/metrics/`
- `GET /api/metrics/?year=2020&region=Europe%20%26%20Central%20Asia&search=Germany`

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

- Deploy PostgreSQL and the Django REST Framework API
- Connect the React frontend to the deployed API
- Add frontend component tests
- Containerize the application with Docker
- Add continuous integration and public deployment

## Data note

The ingestion pipeline uses World Bank indicators `ST.INT.ARVL` (international tourism arrivals) and `ST.INT.RCPT.CD` (international tourism receipts), sourced from UN Tourism and published under CC BY 4.0. Reporting coverage and the most recent year vary by country.

- [Arrivals indicator](https://data.worldbank.org/indicator/ST.INT.ARVL)
- [Receipts indicator](https://data.worldbank.org/indicator/ST.INT.RCPT.CD)
- [World Bank Indicators API documentation](https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures)
