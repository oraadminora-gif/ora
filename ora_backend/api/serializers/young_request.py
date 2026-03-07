from rest_framework import serializers
from core.models import YoungRequest, Etablissement
from .pole import DepartmentSerializer


class EtablissementListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Etablissement
        fields = ['id', 'nom', 'code_postal']


class YoungRequestListSerializer(serializers.ModelSerializer):
    """Serializer liste demandes (léger)"""
    pole_name          = serializers.CharField(source='pole.name', read_only=True, default='')
    etablissement_nom  = serializers.SerializerMethodField()
    diplome_label      = serializers.CharField(source='get_diplome_prepare_display', read_only=True)
    situation_label    = serializers.CharField(source='get_situation_display', read_only=True)

    class Meta:
        model = YoungRequest
        fields = [
            'id', 'first_name', 'last_name', 'city',
            'status', 'urgency_level', 'pole_name',
            'nom_etablissement', 'etablissement_nom',
            'diplome_prepare', 'diplome_label',
            'situation', 'situation_label',
            'created_at',
        ]

    def get_etablissement_nom(self, obj):
        """Retourne le nom de l'établissement validé, sinon le nom libre saisi."""
        if obj.etablissement_id:
            return obj.etablissement.nom
        return obj.nom_etablissement or ''


class YoungRequestSerializer(serializers.ModelSerializer):
    """Serializer demande complet"""
    department        = DepartmentSerializer(read_only=True)
    etablissement     = EtablissementListSerializer(read_only=True)
    pole_name         = serializers.CharField(source='pole.name', read_only=True, default='')
    age               = serializers.SerializerMethodField()
    a_mentorat        = serializers.SerializerMethodField()
    diplome_label     = serializers.CharField(source='get_diplome_prepare_display', read_only=True)
    situation_label   = serializers.CharField(source='get_situation_display', read_only=True)
    etablissement_nom = serializers.SerializerMethodField()

    class Meta:
        model = YoungRequest
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone',
            'birth_date', 'age', 'gender', 'city', 'department',
            'nom_etablissement', 'etablissement', 'etablissement_nom',
            'diplome_prepare', 'diplome_label',
            'situation', 'situation_label',
            'needs_description', 'urgency_level',
            'status', 'pole', 'pole_name',
            'request_date', 'created_at', 'updated_at',
            'a_mentorat',
        ]
        read_only_fields = ['request_date', 'created_at', 'updated_at']

    def get_age(self, obj):
        if not obj.birth_date:
            return None
        from datetime import date
        today = date.today()
        return today.year - obj.birth_date.year - (
            (today.month, today.day) < (obj.birth_date.month, obj.birth_date.day)
        )

    def get_a_mentorat(self, obj):
        return hasattr(obj, 'mentorat')

    def get_etablissement_nom(self, obj):
        if obj.etablissement_id:
            return obj.etablissement.nom
        return obj.nom_etablissement or ''


class YoungRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer création demande (formulaire public)"""
    department_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = YoungRequest
        fields = [
            'first_name', 'last_name', 'email', 'phone',
            'birth_date', 'gender', 'city', 'department_code',
            'nom_etablissement', 'diplome_prepare', 'situation',
            'needs_description', 'urgency_level',
        ]

    def create(self, validated_data):
        dept_code = validated_data.pop('department_code', None)

        # Détermine le pôle à partir du département
        if dept_code:
            from core.models import Department, Pole
            try:
                dept = Department.objects.get(code=dept_code)
                # Un pôle peut couvrir plusieurs départements (M2M)
                pole = Pole.objects.filter(
                    departments=dept, status='ACTIVE'
                ).first()
                validated_data['pole']       = pole
                validated_data['department'] = dept
            except Department.DoesNotExist:
                pass

        return YoungRequest.objects.create(**validated_data)
