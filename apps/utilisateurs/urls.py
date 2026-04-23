from django.urls import path
from .views import (
    LoginView, RefreshTokenView, LogoutView, PasswordResetView,
    InviteUserView, ActivateAccountView, UtilisateurListView, UtilisateurDetailView
)

urlpatterns = [
    # Auth Endpoints
    path('auth/connexion/', LoginView.as_view(), name='connexion'),
    path('auth/connexion/', LoginView.as_view(), name='login'),
    path('auth/rafraichir/', RefreshTokenView.as_view(), name='rafraichir_token'),
    path('auth/deconnexion/', LogoutView.as_view(), name='deconnexion'),
    path('auth/mot-de-passe/reinitialiser/', PasswordResetView.as_view(), name='mot_de_passe_reinit'),
    path('auth/inviter/', InviteUserView.as_view(), name='inviter_utilisateur'),
    path('auth/activer/', ActivateAccountView.as_view(), name='activer_compte'),

    # Users CRUD Endpoints
    path('utilisateurs/', UtilisateurListView.as_view(), name='utilisateur-list'),
    path('utilisateurs/<int:pk>/', UtilisateurDetailView.as_view(), name='utilisateur-detail'),
]
