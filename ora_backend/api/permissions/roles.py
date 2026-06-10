# api/permissions/roles.py
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsCN(BasePermission):
    """Conseiller National - vérifie si l'user a la casquette CN"""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated 
            and hasattr(request.user, 'cn_member')
        )


class IsAnimateur(BasePermission):
    """Tout animateur (AP ou ACP)"""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated 
            and hasattr(request.user, 'animateur')
        )


class IsACP(BasePermission):
    """
    Animateur Coordinateur de Pôle OU CN.
    CN hérite des droits ACP.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # CN peut tout faire (hérite des droits ACP)
        if hasattr(request.user, 'cn_member'):
            return True
        # Vérifie si animateur coordinateur
        return (
            hasattr(request.user, 'animateur')
            and request.user.animateur.is_acp
        )


class IsAP(BasePermission):
    """Animateur de Pôle — ACP hérite également des droits AP."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'animateur')
        )


class IsMentor(BasePermission):
    """Mentor"""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated 
            and hasattr(request.user, 'mentor')
        )


# ✅ NOUVEAU : Permission pour vérifier SI L'USER A AU MOINS UN RÔLE parmi une liste
class HasAnyRole(BasePermission):
    """
    Permission qui vérifie que l'utilisateur a au moins un des rôles requis.
    Usage: HasAnyRole('CN', 'ACP') ou HasAnyRole('MENTOR')
    """
    def __init__(self, *roles):
        self.roles = [r.upper() for r in roles]
    
    def __call__(self):
        return self
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        user = request.user
        
        # Vérifie chaque rôle demandé
        for role in self.roles:
            if role == 'CN' and hasattr(user, 'cn_member'):
                return True
            if role == 'ACP' and hasattr(user, 'animateur') and user.animateur.is_acp:
                return True
            if role == 'AP' and hasattr(user, 'animateur') and (user.animateur.is_ap or user.animateur.is_acp):
                return True
            if role == 'MENTOR' and hasattr(user, 'mentor'):
                return True
        
        return False


# ✅ NOUVEAU : Permission pour KPIs - CN ou ACP (pas besoin d'être les deux)
class IsCNOrACP(BasePermission):
    """CN ou tout animateur (AP ou ACP)."""

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if hasattr(user, 'cn_member'):
            return True
        return hasattr(user, 'animateur')
