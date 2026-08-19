from django.contrib import admin
from django.urls import include, path
from django.views.decorators.csrf import csrf_exempt
from strawberry.django.views import GraphQLView

from tourism.schema import schema

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("tourism.urls")),
    path("graphql/", csrf_exempt(GraphQLView.as_view(schema=schema))),
]
