from django.db import DatabaseError, connection
from django.db.models import BigIntegerField, Count, DecimalField, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework import status
from rest_framework.exceptions import ValidationError
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


class ReadinessView(APIView):
    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except DatabaseError:
            return Response(
                {"status": "unavailable", "database": "unreachable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response({"status": "ready", "database": "reachable"})


def filtered_metrics(request, *, include_year=True):
    queryset = TourismMetric.objects.all()
    year = request.query_params.get("year")
    region = request.query_params.get("region", "").strip()
    search = request.query_params.get("search", "").strip()

    if include_year and year:
        try:
            queryset = queryset.filter(year=int(year))
        except (TypeError, ValueError, DjangoValidationError) as error:
            raise ValidationError({"year": "Enter a valid year."}) from error
    if region:
        queryset = queryset.filter(region__iexact=region)
    if search:
        queryset = queryset.filter(
            Q(country_name__icontains=search) | Q(country_code__iexact=search)
        )
    return queryset


class TourismMetricListView(ListAPIView):
    serializer_class = TourismMetricSerializer
    pagination_class = TourismPagination

    def get_queryset(self):
        return filtered_metrics(self.request)


class TourismMetadataView(APIView):
    def get(self, request):
        years = list(
            TourismMetric.objects.order_by("-year")
            .values_list("year", flat=True)
            .distinct()
        )
        regions = list(
            TourismMetric.objects.order_by("region")
            .values_list("region", flat=True)
            .distinct()
        )
        return Response({"years": years, "regions": regions})


class TourismSummaryView(APIView):
    def get(self, request):
        queryset = filtered_metrics(request).filter(
            Q(arrivals__isnull=False) | Q(receipts_usd__isnull=False)
        )
        totals = queryset.aggregate(
            arrivals=Coalesce(
                Sum("arrivals"), Value(0), output_field=BigIntegerField()
            ),
            receipts_usd=Coalesce(
                Sum("receipts_usd"),
                Value(0),
                output_field=DecimalField(max_digits=24, decimal_places=2),
            ),
            countries=Count("country_code", distinct=True),
        )
        return Response(totals)


class TourismTrendView(APIView):
    def get(self, request):
        rows = (
            filtered_metrics(request, include_year=False)
            .values("year")
            .annotate(
                arrivals=Coalesce(
                    Sum("arrivals"), Value(0), output_field=BigIntegerField()
                )
            )
            .order_by("year")
        )
        return Response(list(rows))
