from django.urls import path

from .views import HealthView, TourismMetricListView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("metrics/", TourismMetricListView.as_view(), name="metric-list"),
]
