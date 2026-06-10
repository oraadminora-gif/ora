#api/auth/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'
    
    def validate(self, attrs):
        # Remplace email par username pour le parent
        attrs['username'] = attrs.get('email', '')
        
        data = super().validate(attrs)
        
        # Ajoute les infos user
        user = self.user
        
        # Détecte les rôles
        roles = []
        if hasattr(user, 'mentor'):
            roles.append('MENTOR')
        if hasattr(user, 'animateur'):
            if user.animateur.is_acp:
                roles.append('ACP')
            if user.animateur.is_ap:
                roles.append('AP')
        if hasattr(user, 'cn_member'):
            roles.append('CN')
        
        # Détermine rôle actif (priorité)
        priority = ['CN', 'ACP', 'AP', 'MENTOR']
        active_role = next((r for r in priority if r in roles), roles[0] if roles else 'UNKNOWN')
        
        # Pôle ID si applicable
        pole_id = None
        if hasattr(user, 'animateur'):
            pole_id = user.animateur.pole_id
        elif hasattr(user, 'mentor'):
            pole_id = user.mentor.pole_id
        
        cn_acces_complet = False
        if hasattr(user, 'cn_member'):
            cn_acces_complet = user.cn_member.cn_acces_complet

        data['user'] = {
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
        }
        
        return data