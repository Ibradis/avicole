from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Swagger Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Apps endpoints
    path('api/', include('apps.organisations.urls')),
    path('api/', include('apps.utilisateurs.urls')),
    path('api/', include('apps.produits.urls')),
    path('api/', include('apps.partenaires.urls')),
    path('api/', include('apps.boutiques.urls')),
    path('api/', include('apps.ferme.urls')),
    path('api/', include('apps.alimentation.urls')),
    path('api/', include('apps.sante.urls')),
    path('api/', include('apps.veterinaires.urls')),
    path('api/', include('apps.finances.urls')),
    path('api/', include('apps.charges.urls')),
    path('api/', include('apps.cofo.urls')),
    path('api/', include('apps.achats.urls')),
    path('api/', include('apps.ventes.urls')),
    path('api/', include('apps.stocks.urls')),
    path('api/', include('apps.rapports.urls')),
    path('api/', include('apps.exportations.urls')),
    # ...
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
