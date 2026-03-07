from rest_framework import serializers
from core.models import CNMember, User


class CNMemberUserSerializer(serializers.ModelSerializer):
    """Serializer User pour CN"""
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'is_staff']


class CNMemberSerializer(serializers.ModelSerializer):
    """Serializer CN complet"""
    user = CNMemberUserSerializer(read_only=True)
    
    class Meta:
        model = CNMember
        fields = [
            'id', 'user', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'is_active', 'is_super_admin', 'created_at'
        ]
        read_only_fields = ['created_at', 'full_name']