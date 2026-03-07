# api/serializers/etablissement.py
from rest_framework import serializers
from core.models import Etablissement


class EtablissementSerializer(serializers.ModelSerializer):
    pole_name = serializers.CharField(source='pole.name', read_only=True)

    class Meta:
        model = Etablissement
        fields = ['id', 'nom', 'code_postal', 'pole', 'pole_name', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class EtablissementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Etablissement
        fields = ['id', 'nom', 'code_postal']
