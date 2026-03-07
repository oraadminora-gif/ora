# api/views/pole/dashboard.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q

from core.models.pole import Pole
from core.models.mentorat import Mentorship
from core.models.young_request import YoungRequest
from core.models.animateur import Animateur
from api.permissions.object_level import CanAccessPole  # ✅ Import corrigé


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanAccessPole])
def pole_dashboard(request, pole_id):
    """
    Dashboard d'un pôle spécifique pour AP/ACP.
    Endpoint: GET /api/poles/{pole_id}/dashboard/
    """
    user = request.user
    
    # Récupérer le pôle
    pole = get_object_or_404(Pole, id=pole_id)
    
    # Compter les associations dans ce pôle
    associations_count = Animateur.objects.filter(pole=pole).count()
    
    # Compter les jeunes (young requests) dans ce pôle
    total_youngs = YoungRequest.objects.filter(pole=pole).count()
    
    # Compter les mentorats actifs
    active_mentorships = Mentorship.objects.filter(
        pole=pole,
        status='active'
    ).count()
    
    # Compter les mentorats clôturés
    completed_mentorships = Mentorship.objects.filter(
        pole=pole,
        status='completed'
    ).count()
    
    # Compter les demandes en attente de matching
    pending_matches = YoungRequest.objects.filter(
        pole=pole,
        status='pending'
    ).count()
    
    # Compter les alertes (mentorats en difficulté)
    alert_count = Mentorship.objects.filter(
        pole=pole,
        status='alert'
    ).count()
    
    # Compter les mentors disponibles vs total
    mentors_data = Mentorship.objects.filter(
        pole=pole
    ).aggregate(
        total_mentors=Count('mentor', distinct=True),
        active_mentors=Count('mentor', filter=Q(status='active'), distinct=True)
    )
    
    # Activités récentes
    recent_activities = []
    
    # Dernières demandes de jeunes
    recent_youngs = YoungRequest.objects.filter(
        pole=pole
    ).order_by('-created_at')[:5]
    
    for young in recent_youngs:
        recent_activities.append({
            'id': f"young_{young.id}",
            'type': 'registration',
            'description': f"Nouvelle demande: {young.first_name} {young.last_name}",
            'date': young.created_at.isoformat() if hasattr(young.created_at, 'isoformat') else str(young.created_at),
            'user_name': 'Système'
        })
    
    # Derniers matchings
    recent_mentorships = Mentorship.objects.filter(
        pole=pole
    ).order_by('-created_at')[:5]
    
    for mentorship in recent_mentorships:
        mentor_email = getattr(mentorship.mentor, 'user', None)
        mentor_email = mentor_email.email if mentor_email else 'Inconnu'
        
        young_email = getattr(mentorship.young, 'email', 'Inconnu')
        
        recent_activities.append({
            'id': f"match_{mentorship.id}",
            'type': 'match',
            'description': f"Nouveau mentorat: {mentor_email} & {young_email}",
            'date': mentorship.created_at.isoformat() if hasattr(mentorship.created_at, 'isoformat') else str(mentorship.created_at),
            'user_name': 'Système'
        })
    
    # Trier par date décroissante
    recent_activities.sort(key=lambda x: x['date'], reverse=True)
    recent_activities = recent_activities[:10]
    
    data = {
        'id': pole.id,
        'name': pole.name,
        'city': pole.city or 'Non défini',
        'associations_count': associations_count,
        'total_youngs': total_youngs,
        'active_mentorships': active_mentorships,
        'completed_mentorships': completed_mentorships,
        'pending_matches': pending_matches,
        'alert_count': alert_count,
        'mentors_total': mentors_data.get('total_mentors') or 0,
        'mentors_active': mentors_data.get('active_mentors') or 0,
        'recent_activities': recent_activities,
    }
    
    return Response(data)