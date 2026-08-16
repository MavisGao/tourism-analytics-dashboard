from rest_framework import serializers

from .models import MarketMetric


class MarketMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketMetric
        fields = [
            "id", "name", "region", "year", "visitors", "spend_millions",
            "average_nights", "yoy_change",
        ]

