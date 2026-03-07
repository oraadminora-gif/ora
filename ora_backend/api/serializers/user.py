from rest_framework import serializers
from core.models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer pour lecture User"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    roles = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 
                  'is_active', 'is_staff', 'date_joined', 'roles']
        read_only_fields = ['date_joined']
    
    def get_roles(self, obj):
        """Retourne les rôles de l'utilisateur"""
        roles = []
        if hasattr(obj, 'mentor'):
            roles.append('MENTOR')
        if hasattr(obj, 'animateur'):
            roles.append('ACP' if obj.animateur.is_coordinator else 'AP')
        if hasattr(obj, 'cn_member'):
            roles.append('CN')
        return roles


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer pour création User"""
    password = serializers.CharField(write_only=True, required=True)
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password_confirm', 'is_staff']
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas")
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user