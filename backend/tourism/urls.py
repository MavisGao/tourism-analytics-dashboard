from django.urls import path

from .views import (
    HealthView,
    ReadinessView,
    TourismMetadataView,
    TourismMetricListView,
    TourismSummaryView,
    TourismTrendView,
)

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("ready/", ReadinessView.as_view(), name="readiness"),
    path("metadata/", TourismMetadataView.as_view(), name="metadata"),
    path("metrics/", TourismMetricListView.as_view(), name="metric-list"),
    path("summary/", TourismSummaryView.as_view(), name="summary"),
    path("trends/", TourismTrendView.as_view(), name="trends"),
]
