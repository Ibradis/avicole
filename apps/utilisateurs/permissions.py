from rest_framework import permissions

class IsOrganisationAdmin(permissions.BasePermission):
    """Accès réservé à l'Administrateur ou au PDG de l'organisation."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['admin', 'pdg'])

class IsOrganisationAdminOrReadOnly(permissions.BasePermission):
    """Permet la lecture à tous les membres, mais réserve les modifications aux Administrateurs/PDG."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_authenticated and request.user.role in ['admin', 'pdg'])

class IsControleur(permissions.BasePermission):
    """Accès réservé au Contrôleur."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'controleur')

class IsGerantBoutique(permissions.BasePermission):
    """Accès réservé au Gérant de Boutique."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'gerant')

class IsVendeur(permissions.BasePermission):
    """Accès réservé au Vendeur."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'vendeur')

class IsStaffOrAdmin(permissions.BasePermission):
    """Accès ouvert à l'administration ou au staff de haut niveau."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role in ['admin', 'pdg', 'controleur'] or request.user.is_superuser))

class IsOwnerOrAdmin(permissions.BasePermission):
    """Permission permettant à l'utilisateur de modifier son propre profil ou à un admin de modifier n'importe qui."""
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        # Un admin/pdg peut tout faire
        if request.user.role in ['admin', 'pdg']:
            return True
        # L'utilisateur peut modifier son propre compte
        return obj == request.user

class IsOwner(permissions.BasePermission):
    """Permission stricte : seul le propriétaire de l'objet peut agir."""
    def has_object_permission(self, request, view, obj):
        return bool(request.user and request.user.is_authenticated and obj == request.user)
