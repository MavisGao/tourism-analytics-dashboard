import json

from django.db import DatabaseError, connection
from django.test import TestCase
from unittest.mock import patch
from rest_framework.test import APIClient

from .models import TourismMetric


class TourismMetricApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        TourismMetric.objects.create(country_code="CAN", country_name="Canada", region="North America", year=2020, arrivals=3_000_000, receipts_usd="15000000000")
        TourismMetric.objects.create(country_code="DEU", country_name="Germany", region="Europe & Central Asia", year=2020, arrivals=12_000_000, receipts_usd="22000000000")

    def test_health_endpoint(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_metric_endpoint_filters_by_region(self):
        response = self.client.get("/api/metrics/", {"region": "Europe & Central Asia"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["country_code"], "DEU")

    def test_metric_endpoint_searches_by_country(self):
        response = self.client.get("/api/metrics/", {"search": "can"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["results"][0]["country_name"], "Canada")

    def test_metric_endpoint_filters_by_year(self):
        TourismMetric.objects.create(
            country_code="CAN",
            country_name="Canada",
            region="North America",
            year=2021,
            arrivals=4_000_000,
        )
        response = self.client.get("/api/metrics/", {"year": "2021"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["year"], 2021)

    def test_metric_endpoint_rejects_invalid_year(self):
        response = self.client.get("/api/metrics/", {"year": "latest"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["year"], "Enter a valid year.")

    def test_metadata_endpoint_returns_filters(self):
        response = self.client.get("/api/metadata/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["years"], [2020])
        self.assertEqual(
            response.json()["regions"],
            ["Europe & Central Asia", "North America"],
        )

    def test_summary_endpoint_aggregates_filtered_metrics(self):
        response = self.client.get(
            "/api/summary/", {"year": 2020, "region": "North America"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["arrivals"], 3_000_000)
        self.assertEqual(response.json()["receipts_usd"], 15_000_000_000.0)
        self.assertEqual(response.json()["countries"], 1)

    def test_trend_endpoint_groups_arrivals_by_year(self):
        TourismMetric.objects.create(
            country_code="CAN",
            country_name="Canada",
            region="North America",
            year=2021,
            arrivals=4_000_000,
        )
        response = self.client.get("/api/trends/", {"region": "North America"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            [
                {"year": 2020, "arrivals": 3_000_000},
                {"year": 2021, "arrivals": 4_000_000},
            ],
        )

    def test_readiness_endpoint_checks_database(self):
        response = self.client.get("/api/ready/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(), {"status": "ready", "database": "reachable"}
        )

    def test_readiness_endpoint_reports_database_failure(self):
        with patch.object(connection, "cursor", side_effect=DatabaseError):
            response = self.client.get("/api/ready/")
        self.assertEqual(response.status_code, 503)


class CountryGraphQLTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        TourismMetric.objects.create(
            country_code="CAN",
            country_name="Canada",
            region="North America",
            year=2019,
            arrivals=22_000_000,
            receipts_usd="33000000000",
        )
        TourismMetric.objects.create(
            country_code="CAN",
            country_name="Canada",
            region="North America",
            year=2020,
            arrivals=3_000_000,
            receipts_usd="15000000000",
        )

    def graphql(self, code):
        return self.client.post(
            "/graphql/",
            data=json.dumps(
                {
                    "query": """
                        query CountryDetail($code: String!) {
                          country(code: $code) {
                            code
                            name
                            region
                            source
                            metrics { year arrivals receiptsUsd }
                          }
                        }
                    """,
                    "variables": {"code": code},
                }
            ),
            content_type="application/json",
        )

    def test_country_query_returns_ordered_history(self):
        response = self.graphql("can")

        self.assertEqual(response.status_code, 200)
        country = response.json()["data"]["country"]
        self.assertEqual(country["name"], "Canada")
        self.assertEqual(country["region"], "North America")
        self.assertEqual(
            [row["year"] for row in country["metrics"]], [2019, 2020]
        )
        self.assertEqual(country["metrics"][1]["arrivals"], 3_000_000)
        self.assertEqual(country["metrics"][1]["receiptsUsd"], "15000000000.00")

    def test_country_query_returns_null_for_unknown_code(self):
        response = self.graphql("ZZZ")

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["data"]["country"])
