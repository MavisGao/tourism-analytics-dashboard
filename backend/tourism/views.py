from django.db.models import Q
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MarketMetric
from .serializers import MarketMetricSerializer


class HealthView(APIView):
    def get(self, request):
        return Response({"status": "ok"})


class MarketMetricListView(ListAPIView):
    serializer_class = MarketMetricSerializer

    def get_queryset(self):
        queryset = MarketMetric.objects.all()
        year = self.request.query_params.get("year")
        region = self.request.query_params.get("region")
        search = self.request.query_params.get("search")

        if year:
            queryset = queryset.filter(year=year)
        if region:
            queryset = queryset.filter(region__iexact=region)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(region__icontains=search))
        return queryset

