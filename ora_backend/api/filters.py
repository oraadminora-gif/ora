#api/filters.py
from django.db import models
import django_filters
from core.models import Mentor, YoungRequest, Mentorat, Animateur


class MentorFilter(django_filters.FilterSet):
    """Filtres pour les mentors"""
    disponible = django_filters.BooleanFilter(method='filter_disponible')
    pole_code = django_filters.CharFilter(field_name='pole__code', lookup_expr='iexact')
    association_id = django_filters.NumberFilter(field_name='association__id')
    search = django_filters.CharFilter(method='filter_search')
    
    class Meta:
        model = Mentor
        fields = ['pole', 'association', 'is_active', 'is_trained']
    
    def filter_disponible(self, queryset, name, value):
        if value:
            return queryset.filter(disponibilite_reelle__gt=0)
        return queryset.filter(disponibilite_reelle=0)
    
    def filter_search(self, queryset, name, value):
        return queryset.filter(
            models.Q(first_name__icontains=value) |
            models.Q(last_name__icontains=value) |
            models.Q(email__icontains=value)
        )


class YoungRequestFilter(django_filters.FilterSet):
    """Filtres pour les demandes jeunes"""
    status   = django_filters.MultipleChoiceFilter(choices=YoungRequest.STATUS_CHOICES)
    pole_id  = django_filters.NumberFilter(field_name='pole__id')
    diplome  = django_filters.ChoiceFilter(field_name='diplome_prepare',
                                           choices=YoungRequest.DIPLOME_CHOICES)
    situation = django_filters.ChoiceFilter(field_name='situation',
                                            choices=YoungRequest.SITUATION_CHOICES)
    urgent   = django_filters.BooleanFilter(method='filter_urgent')
    search   = django_filters.CharFilter(method='filter_search')

    class Meta:
        model  = YoungRequest
        fields = ['status', 'gender', 'pole', 'diplome_prepare', 'situation']
    
    def filter_urgent(self, queryset, name, value):
        return queryset

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            models.Q(first_name__icontains=value) |
            models.Q(last_name__icontains=value) |
            models.Q(city__icontains=value) |
            models.Q(email__icontains=value)
        )


class MentoratFilter(django_filters.FilterSet):
    """Filtres pour les mentorats"""
    status = django_filters.MultipleChoiceFilter(choices=Mentorat.STATUS_CHOICES)
    pole_id = django_filters.NumberFilter(field_name='pole__id')
    alerte = django_filters.BooleanFilter(field_name='alerte_rouge')
    en_cours = django_filters.BooleanFilter(method='filter_en_cours')
    
    class Meta:
        model = Mentorat
        fields = ['status', 'pole', 'ap_responsable']
    
    def filter_en_cours(self, queryset, name, value):
        if value:
            return queryset.filter(status='ACTIVE')
        return queryset.exclude(status='ACTIVE')


class AnimateurFilter(django_filters.FilterSet):
    """Filtres pour les animateurs"""
    role = django_filters.CharFilter(method='filter_role')
    pole_id = django_filters.NumberFilter(field_name='pole__id')
    association_id = django_filters.NumberFilter(field_name='association__id')
    actif = django_filters.BooleanFilter(field_name='is_active')
    
    class Meta:
        model = Animateur
        fields = ['pole', 'association', 'is_acp', 'is_ap', 'is_active']

    def filter_role(self, queryset, name, value):
        if value.upper() == 'ACP':
            return queryset.filter(is_acp=True)
        elif value.upper() == 'AP':
            return queryset.filter(is_ap=True)
        return queryset