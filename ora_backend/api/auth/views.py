# api/auth/views.py
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .serializers import CustomTokenObtainPairSerializer


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class TokenRefreshView(TokenRefreshView):
    pass


class ChangePasswordView(APIView):
    """POST /auth/change-password/ — change le mot de passe de l'utilisateur connecté."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password    = request.data.get('old_password', '')
        new_password    = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')

        if not old_password or not new_password:
            return Response({"error": "Tous les champs sont requis"}, status=400)

        if not user.check_password(old_password):
            return Response({"error": "Mot de passe actuel incorrect"}, status=400)

        if len(new_password) < 8:
            return Response({"error": "Le nouveau mot de passe doit contenir au moins 8 caractères"}, status=400)

        if new_password != confirm_password:
            return Response({"error": "Les mots de passe ne correspondent pas"}, status=400)

        if new_password == old_password:
            return Response({"error": "Le nouveau mot de passe doit être différent de l'ancien"}, status=400)

        user.set_password(new_password)
        user.save()
        return Response({"message": "Mot de passe modifié avec succès"})


class MeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Rôles
        roles = []
        if hasattr(user, 'mentor'):
            roles.append('MENTOR')
        if hasattr(user, 'animateur'):
            roles.append('ACP' if user.animateur.is_coordinator else 'AP')
        if hasattr(user, 'cn_member'):
            roles.append('CN')
        
        priority = ['CN', 'ACP', 'AP', 'MENTOR']
        active_role = next((r for r in priority if r in roles), roles[0] if roles else 'UNKNOWN')
        
        pole_id = None
        if hasattr(user, 'animateur'):
            pole_id = user.animateur.pole_id
        elif hasattr(user, 'mentor'):
            pole_id = user.mentor.pole_id
        
        cn_acces_complet = False
        if hasattr(user, 'cn_member'):
            cn_acces_complet = user.cn_member.cn_acces_complet

        return Response({
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'capabilities': {
                'roles': roles,
                'active_role': active_role,
                'is_multi_role': len(roles) > 1,
                'pole_id': pole_id,
                'cn_acces_complet': cn_acces_complet,
            }
        })