from django.urls import path

from .views import HealthView, MarketMetricListView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("markets/", MarketMetricListView.as_view(), name="market-list"),
]

