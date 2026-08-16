# Tourism Analytics Dashboard

An interactive portfolio dashboard for exploring tourism trends, visitor spending, hotel occupancy, and source-market performance.

## Current status

This repository contains the first frontend milestone. It uses clearly labeled sample data while the backend and public-data ingestion pipeline are under development.

## Features

- Responsive KPI overview for visitor volume, spending, average stay, and hotel occupancy
- Interactive region and year controls
- Searchable source-market table
- Monthly visitor trend visualization
- Accessible labels and mobile-friendly layout

## Tech stack

- React
- TypeScript
- Vite
- CSS

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.

## Build

```bash
npm run build
```

## Roadmap

- Add a Django REST Framework API
- Persist destination and market metrics in PostgreSQL
- Replace sample values with documented public datasets
- Add API and frontend tests
- Containerize the application with Docker
- Add continuous integration and public deployment

## Data note

All dashboard values in the current version are demonstration data. They do not represent official Philadelphia tourism statistics.
