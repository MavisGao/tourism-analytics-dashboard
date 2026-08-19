from rest_framework import serializers

from .models import TourismMetric


class TourismMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = TourismMetric
        fields = ["id", "country_code", "country_name", "region", "year", "arrivals", "receipts_usd", "source", "imported_at"]

