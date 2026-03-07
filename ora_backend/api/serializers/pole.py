# api/serializers/pole.py
from django.db.models import Q
from rest_framework import serializers
from core.models import Pole, Department, Association


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer Department (lecture seule)"""
    class Meta:
        model = Department
        fields = ['id', 'code', 'name']


class AssociationSerializer(serializers.ModelSerializer):
    """Serializer Association"""
    class Meta:
        model = Association
        fields = ['id', 'code', 'name', 'is_active']
        read_only_fields = ['created_at']


class AssociationListSerializer(serializers.ModelSerializer):
    """Serializer liste Association (léger)"""
    class Meta:
        model = Association
        fields = ['id', 'code', 'name']


class PoleSerializer(serializers.ModelSerializer):
    """Serializer Pole complet"""
    departments = DepartmentSerializer(many=True, read_only=True)
    department_ids = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='departments',
        many=True,
        write_only=True,
        required=False,
    )
    associations_count  = serializers.SerializerMethodField()
    animateurs_count    = serializers.IntegerField(source='animateurs.count', read_only=True)
    mentors_count       = serializers.IntegerField(source='mentors.count', read_only=True)
    etat_activite_label = serializers.SerializerMethodField()

    class Meta:
        model = Pole
        fields = [
            'id', 'code', 'name', 'status',
            'villes', 'etat_activite', 'etat_activite_label',
            'contact_email', 'contact_phone',
            'departments', 'department_ids',
            'associations_count', 'animateurs_count', 'mentors_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_etat_activite_label(self, obj):
        return obj.get_etat_activite_display() if obj.etat_activite else ''

    def get_associations_count(self, obj):
        return Association.objects.filter(
            Q(animateurs__pole=obj) | Q(mentors__pole=obj),
            is_active=True,
        ).distinct().count()

    def validate_code(self, value):
        if not value.isalnum():
            raise serializers.ValidationError("Le code doit être alphanumérique")
        return value.upper()

    def create(self, validated_data):
        departments = validated_data.pop('departments', [])
        instance = super().create(validated_data)
        instance.departments.set(departments)
        return instance

    def update(self, instance, validated_data):
        departments = validated_data.pop('departments', None)
        instance = super().update(instance, validated_data)
        if departments is not None:
            instance.departments.set(departments)
        return instance
