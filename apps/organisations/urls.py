from django.urls import path

from .views import OrganisationInscriptionView, OrganisationDetailView

urlpatterns = [
    path("organisations/inscription/", OrganisationInscriptionView.as_view(), name="organisation-inscription"),
    path("organisations/details/", OrganisationDetailView.as_view(), name="organisation-details"),
]
