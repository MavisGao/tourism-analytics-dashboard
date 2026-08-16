import json
from decimal import Decimal
from urllib.parse import urlencode
from urllib.request import urlopen

from django.core.management.base import BaseCommand, CommandError

from tourism.models import TourismMetric

API_ROOT = "https://api.worldbank.org/v2"
INDICATORS = {"ST.INT.ARVL": "arrivals", "ST.INT.RCPT.CD": "receipts_usd"}


def fetch_json(path: str, params: dict) -> list:
    url = f"{API_ROOT}/{path}?{urlencode(params)}"
    with urlopen(url, timeout=30) as response:
        return json.load(response)


class Command(BaseCommand):
    help = "Import international tourism indicators from the World Bank API."

    def add_arguments(self, parser):
        parser.add_argument("--start-year", type=int, default=2015)
        parser.add_argument("--end-year", type=int, default=2023)

    def handle(self, *args, **options):
        start_year, end_year = options["start_year"], options["end_year"]
        if start_year > end_year:
            raise CommandError("start-year must be less than or equal to end-year")
        countries_payload = fetch_json("country", {"format": "json", "per_page": 400})
        countries = {country["id"]: {"name": country["name"], "region": country["region"]["value"]} for country in countries_payload[1] if country["region"]["id"] != "NA"}
        rows: dict[tuple[str, int], dict] = {}
        for indicator, field in INDICATORS.items():
            payload = fetch_json(f"country/all/indicator/{indicator}", {"format": "json", "date": f"{start_year}:{end_year}", "per_page": 20000})
            for item in payload[1] or []:
                code, value = item["countryiso3code"], item["value"]
                if code not in countries or value is None:
                    continue
                row = rows.setdefault((code, int(item["date"])), {})
                row[field] = Decimal(str(value)) if field == "receipts_usd" else int(value)
        for (code, year), values in rows.items():
            TourismMetric.objects.update_or_create(country_code=code, year=year, defaults={"country_name": countries[code]["name"], "region": countries[code]["region"], **values})
        self.stdout.write(self.style.SUCCESS(f"Imported {len(rows)} country-year records."))
