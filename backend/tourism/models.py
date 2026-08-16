from django.db import models


class MarketMetric(models.Model):
    name = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    year = models.PositiveSmallIntegerField()
    visitors = models.PositiveIntegerField()
    spend_millions = models.DecimalField(max_digits=10, decimal_places=2)
    average_nights = models.DecimalField(max_digits=4, decimal_places=1)
    yoy_change = models.DecimalField(max_digits=5, decimal_places=1)

    class Meta:
        ordering = ["-visitors", "name"]
        constraints = [
            models.UniqueConstraint(fields=["name", "year"], name="unique_market_year"),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.year})"

