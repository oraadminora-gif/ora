from rest_framework import serializers
from core.models import Mentorat
from .mentor import MentorListSerializer


class MentoratListSerializer(serializers.ModelSerializer):
    """Serializer liste mentorats (léger)"""
    mentor_name = serializers.CharField(source='mentor.full_name', read_only=True)
    jeune_name = serializers.CharField(
        source='young_request.first_name', read_only=True
    )
    jeune_id = serializers.IntegerField(source='young_request.id', read_only=True)
    
    class Meta:
        model = Mentorat
        fields = [
            'id', 'mentor_name', 'jeune_name', 'jeune_id',
            'status', 'alerte_rouge', 'assigned_at'
        ]


class MentoratSerializer(serializers.ModelSerializer):
    """Serializer mentorat complet"""
    mentor = MentorListSerializer(read_only=True)
    jeune = serializers.SerializerMethodField()
    ap_responsable_name = serializers.CharField(
        source='ap_responsable.full_name', read_only=True
    )
    duree_mois = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Mentorat
        fields = [
            'id', 'mentor', 'jeune',
            'pole', 'ap_responsable', 'ap_responsable_name',
            'status', 'assigned_at', 'expected_end_date', 'closed_at',
            'duree_mois', 'closure_reason',
            'alerte_rouge', 'dernier_contact', 'notes_suivi',
            'created_at'
        ]
        read_only_fields = ['created_at']
    
    def get_jeune(self, obj):
        return {
            'id': obj.young_request.id,
            'nom': f"{obj.young_request.first_name} {obj.young_request.last_name}",
            'email': obj.young_request.email,
            'ville': obj.young_request.city,
            'besoins': obj.young_request.needs_description[:200] + '...' 
                      if len(obj.young_request.needs_description) > 200 
                      else obj.young_request.needs_description
        }


class MentoratCreateSerializer(serializers.ModelSerializer):
    """Serializer création mentorat (par ACP)"""
    mentor_id = serializers.IntegerField(write_only=True)
    young_request_id = serializers.IntegerField(write_only=True)
    ap_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Mentorat
        fields = ['mentor_id', 'young_request_id', 'ap_id']
    
    def validate(self, data):
        from core.models import Mentor, YoungRequest, Animateur
        
        # Vérifie mentor
        try:
            mentor = Mentor.objects.get(id=data['mentor_id'])
        except Mentor.DoesNotExist:
            raise serializers.ValidationError("Mentor introuvable")
        
        if mentor.disponibilite_reelle <= 0:
            raise serializers.ValidationError("Mentor indisponible")
        
        # Vérifie demande
        try:
            young = YoungRequest.objects.get(id=data['young_request_id'])
        except YoungRequest.DoesNotExist:
            raise serializers.ValidationError("Demande introuvable")
        
        if young.status not in ['NEW', 'PENDING']:
            raise serializers.ValidationError("Cette demande n'est plus disponible")
        
        # Vérifie AP si fourni
        if data.get('ap_id'):
            try:
                ap = Animateur.objects.get(
                    id=data['ap_id'],
                    is_ap=True,
                    is_active=True
                )
                data['ap_responsable'] = ap
            except Animateur.DoesNotExist:
                raise serializers.ValidationError("AP introuvable ou inactif")
        
        data['mentor'] = mentor
        data['young_request'] = young
        data['pole'] = mentor.pole
        
        return data
    
    def create(self, validated_data):
        validated_data.pop('mentor_id')
        validated_data.pop('young_request_id')
        validated_data.pop('ap_id', None)
        
        mentorat = Mentorat.objects.create(
            status='ACTIVE',
            **validated_data
        )
        
        # Met à jour le mentor
        mentor = validated_data['mentor']
        mentor.disponibilite_reelle -= 1
        mentor.save()
        
        # Met à jour la demande
        young = validated_data['young_request']
        young.status = 'ASSIGNED'
        young.save()
        
        return mentorat