from rest_framework import serializers
from core.models import Animateur, User


class AnimateurUserSerializer(serializers.ModelSerializer):
    """Serializer User imbriqué pour Animateur"""
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']


class AnimateurSerializer(serializers.ModelSerializer):
    """Serializer Animateur pour lecture"""
    user = AnimateurUserSerializer(read_only=True)
    pole_name = serializers.CharField(source='pole.name', read_only=True)
    pole_code = serializers.CharField(source='pole.code', read_only=True)
    association_name = serializers.CharField(source='association.name', read_only=True)
    role = serializers.SerializerMethodField()
    
    class Meta:
        model = Animateur
        fields = [
            'id', 'user', 'first_name', 'last_name', 'full_name', 'email', 'phone', 'city',
            'pole', 'pole_name', 'pole_code',
            'association', 'association_name',
            'is_acp', 'is_ap', 'role', 'is_active', 'created_at'
        ]
        read_only_fields = ['created_at', 'full_name']
    
    def get_role(self, obj):
        if obj.is_acp and obj.is_ap:
            return "ACP/AP"
        if obj.is_acp:
            return "ACP"
        if obj.is_ap:
            return "AP"
        return "N/A"


class AnimateurCreateSerializer(serializers.ModelSerializer):
    """Serializer pour création Animateur (avec création User)"""
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, required=False, default='ora2026')
    
    class Meta:
        model = Animateur
        fields = [
            'email', 'first_name', 'last_name', 'password',
            'pole', 'association', 'phone', 'city',
            'is_acp', 'is_ap', 'is_active'
        ]
    
    def create(self, validated_data):
        # Crée le User
        user_data = {
            'email': validated_data.pop('email'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'password': validated_data.pop('password'),
        }
        user = User.objects.create_user(**user_data)
        
        # Crée l'Animateur
        validated_data['user'] = user
        animateur = Animateur.objects.create(**validated_data)
        return animateur