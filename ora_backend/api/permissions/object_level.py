# api/permissions/object_level.py
from rest_framework.permissions import BasePermission


class IsACPOfPole(BasePermission):
    """
    Vérifie que l'user est ACP de ce pôle.
    CN passe toujours.
    """
    message = "Vous n'êtes pas coordinateur de ce pôle."
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if hasattr(user, 'cn_member'):
            return True
        
        if not (hasattr(user, 'animateur') and user.animateur.is_coordinator):
            return False
        
        pole_id = getattr(obj, 'pole_id', None) or getattr(obj, 'id', None)
        return user.animateur.pole_id == pole_id


class IsAPOfAssociation(BasePermission):
    """
    AP : son association uniquement.
    ACP peut voir toutes les assos de son pôle (pour matching).
    CN : tout.
    """
    message = "Accès réservé à votre association."
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if hasattr(user, 'cn_member'):
            return True
        
        animateur = getattr(user, 'animateur', None)
        if not animateur:
            return False
        
        # ACP : lecture de toutes les assos de son pôle
        if animateur.is_coordinator and request.method in ['GET', 'HEAD', 'OPTIONS']:
            obj_pole_id = getattr(obj, 'pole_id', None)
            if obj_pole_id:
                return obj_pole_id == animateur.pole_id
        
        # Écriture : son association uniquement
        obj_asso_id = getattr(obj, 'association_id', None)
        return obj_asso_id == animateur.association_id


class CanAccessPole(BasePermission):
    """
    Permission qui vérifie que l'utilisateur peut accéder au pôle demandé.
    - CN : accès à tous les pôles
    - ACP/AP : accès uniquement à leur pôle
    - Mentor : accès à son pôle (si assigné)
    """
    message = "Vous n'avez pas accès à ce pôle."
    
    def has_permission(self, request, view):
        user = request.user
        
        # CN peut tout voir
        if hasattr(user, 'cn_member'):
            return True
        
        # Vérifier que l'utilisateur a un pôle assigné
        if not hasattr(user, 'animateur') or not user.animateur.pole_id:
            return False
        
        # Récupérer le pole_id de l'URL
        pole_id = view.kwargs.get('pole_id')
        
        if not pole_id:
            return False
        
        # ACP/AP/MENTOR ne peuvent voir que leur propre pôle
        return str(user.animateur.pole_id) == str(pole_id)
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class CanMatchRequest(BasePermission):
    """
    Matching : ACP de son pôle uniquement.
    """
    message = "Seuls les coordinateurs de pôle peuvent faire le matching."
    
    def has_permission(self, request, view):
        user = request.user
        if hasattr(user, 'cn_member'):
            return True
        return (
            hasattr(user, 'animateur') 
            and user.animateur.is_coordinator
        )
    
    def has_object_permission(self, request, view, young_request):
        user = request.user
        
        if hasattr(user, 'cn_member'):
            return True
        
        if young_request.pole_id != user.animateur.pole_id:
            self.message = "Cette demande n'est pas dans votre pôle."
            return False
        
        if young_request.status not in ['NEW', 'PENDING']:
            self.message = "Cette demande n'est plus disponible."
            return False
        
        return True