#api/serializers/mentor.py
from rest_framework import serializers
from core.models import Mentor, User
from .pole import AssociationListSerializer


class MentorUserSerializer(serializers.ModelSerializer):
    """Serializer User imbriqué pour Mentor"""
    class Meta:
        model = User
        fields = ['id', 'email']


class MentorListSerializer(serializers.ModelSerializer):
    """Serializer liste Mentor (léger)"""
    association = AssociationListSerializer(read_only=True)
    est_disponible = serializers.BooleanField(source='disponibilite_reelle', read_only=True)
    pole_name = serializers.CharField(source='pole.name', read_only=True, default='')

    class Meta:
        model = Mentor
        fields = ['id', 'first_name', 'last_name', 'full_name', 'email',
                  'phone', 'city', 'association', 'pole_name',
                  'disponibilite_reelle', 'max_capacity',
                  'est_disponible', 'is_trained', 'is_active']


class MentorSerializer(serializers.ModelSerializer):
    """Serializer Mentor complet"""
    user = MentorUserSerializer(read_only=True)
    association = AssociationListSerializer(read_only=True)
    pole_name = serializers.CharField(source='pole.name', read_only=True)
    taux_occupation = serializers.SerializerMethodField()
    
    class Meta:
        model = Mentor
        fields = [
            'id', 'user', 'first_name', 'last_name', 'full_name', 'email', 'phone',
            'pole', 'pole_name', 'association',
            'max_capacity', 'disponibilite_reelle', 'taux_occupation',
            'is_active', 'is_trained', 'training_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_taux_occupation(self, obj):
        if obj.max_capacity == 0:
            return 0
        return round((obj.max_capacity - obj.disponibilite_reelle) / obj.max_capacity * 100)


class MentorCreateSerializer(serializers.ModelSerializer):
    """Serializer pour création Mentor"""
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    create_user = serializers.BooleanField(write_only=True, default=False)
    
    class Meta:
        model = Mentor
        fields = [
            'email', 'first_name', 'last_name', 'password', 'create_user',
            'pole', 'association', 'phone',
            'max_capacity', 'disponibilite_reelle',
            'is_trained', 'training_date', 'is_active'
        ]
    
    def create(self, validated_data):
        create_user = validated_data.pop('create_user', False)
        
        if create_user:
            user_data = {
                'email': validated_data.pop('email'),
                'first_name': validated_data.pop('first_name'),
                'last_name': validated_data.pop('last_name'),
                'password': validated_data.pop('password') or 'ora2026',
            }
            user = User.objects.create_user(**user_data)
            validated_data['user'] = user
        else:
            # Sans user, on met les infos directement
            validated_data['first_name'] = validated_data.get('first_name', '')
            validated_data['last_name'] = validated_data.get('last_name', '')
            validated_data['email'] = validated_data.get('email', '')
        
        return Mentor.objects.create(**validated_data)