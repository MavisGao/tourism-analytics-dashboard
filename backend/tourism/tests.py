from django.test import TestCase
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

