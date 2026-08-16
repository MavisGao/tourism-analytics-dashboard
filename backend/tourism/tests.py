from django.test import TestCase
from rest_framework.test import APIClient

from .models import MarketMetric


class MarketMetricApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        MarketMetric.objects.create(
            name="Canada", region="North America", year=2026, visitors=24320,
            spend_millions="19.20", average_nights="3.1", yoy_change="8.7",
        )
        MarketMetric.objects.create(
            name="Germany", region="Europe", year=2026, visitors=9850,
            spend_millions="10.10", average_nights="3.8", yoy_change="-1.9",
        )

    def test_health_endpoint(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_market_endpoint_filters_by_region(self):
        response = self.client.get("/api/markets/", {"region": "Europe"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["name"], "Germany")

