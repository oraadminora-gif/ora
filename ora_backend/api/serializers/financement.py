# api/serializers/financement.py
from rest_framework import serializers
from core.models import Financement, MentoratFinancement


class FinancementSerializer(serializers.ModelSerializer):
    type_label = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Financement
        fields = ['id', 'code', 'nom', 'type', 'type_label']


class MentoratFinancementSerializer(serializers.ModelSerializer):
    financement = FinancementSerializer(read_only=True)
    financement_id = serializers.PrimaryKeyRelatedField(
        queryset=Financement.objects.all(),
        source='financement',
        write_only=True,
    )

    class Meta:
        model = MentoratFinancement
        fields = ['id', 'financement', 'financement_id', 'code_specifique', 'added_at']
        read_only_fields = ['added_at']
