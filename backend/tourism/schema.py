from typing import Optional

import strawberry

from .models import TourismMetric


@strawberry.type
class CountryYearMetric:
    year: int
    arrivals: Optional[int]
    receipts_usd: Optional[str]


@strawberry.type
class CountryDetail:
    code: str
    name: str
    region: str
    source: str
    metrics: list[CountryYearMetric]


@strawberry.type
class Query:
    @strawberry.field
    def country(self, code: str) -> Optional[CountryDetail]:
        rows = list(
            TourismMetric.objects.filter(country_code__iexact=code).order_by("year")
        )
        if not rows:
            return None

        first = rows[0]
        return CountryDetail(
            code=first.country_code,
            name=first.country_name,
            region=first.region.strip(),
            source=first.source,
            metrics=[
                CountryYearMetric(
                    year=row.year,
                    arrivals=row.arrivals,
                    receipts_usd=(
                        str(row.receipts_usd) if row.receipts_usd is not None else None
                    ),
                )
                for row in rows
            ],
        )


schema = strawberry.Schema(query=Query)
