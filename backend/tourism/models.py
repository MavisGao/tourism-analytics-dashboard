from django.db import models


class TourismMetric(models.Model):
    country_code = models.CharField(max_length=3)
    country_name = models.CharField(max_length=120)
    region = models.CharField(max_length=120)
    year = models.PositiveSmallIntegerField()
    arrivals = models.BigIntegerField(null=True, blank=True)
    receipts_usd = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    source = models.CharField(max_length=120, default="World Bank / UN Tourism")
    imported_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-year", "-arrivals", "country_name"]
        constraints = [models.UniqueConstraint(fields=["country_code", "year"], name="unique_country_year")]
        indexes = [models.Index(fields=["year", "region"]), models.Index(fields=["country_name"])]

    def __str__(self) -> str:
        return f"{self.country_name} ({self.year})"

