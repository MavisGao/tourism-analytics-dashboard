from django.db.models import Q
from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import TourismMetric
from .serializers import TourismMetricSerializer


class TourismPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 1000


class HealthView(APIView):
    def get(self, request):
        return Response({"status": "ok"})


class TourismMetricListView(ListAPIView):
    serializer_class = TourismMetricSerializer
    pagination_class = TourismPagination

    def get_queryset(self):
        queryset = TourismMetric.objects.all()
        year = self.request.query_params.get("year")
        region = self.request.query_params.get("region")
        search = self.request.query_params.get("search")
        if year:
            queryset = queryset.filter(year=year)
        if region:
            queryset = queryset.filter(region__iexact=region)
        if search:
            queryset = queryset.filter(Q(country_name__icontains=search) | Q(country_code__iexact=search))
        return queryset

