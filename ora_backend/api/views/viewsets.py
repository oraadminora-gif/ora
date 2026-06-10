# api/views/viewsets.py
from django.db import models
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from core.models import Mentor, YoungRequest, Mentorat, Animateur, Pole, SuiviMentorat, Financement, MentoratFinancement
from api.permissions import IsCN, IsACP, IsAP, IsMentor, IsACPOfPole
from api.serializers import (
    MentorSerializer, MentorListSerializer, MentorCreateSerializer,
    YoungRequestSerializer, YoungRequestListSerializer, YoungRequestCreateSerializer,
    MentoratSerializer, MentoratListSerializer, MentoratCreateSerializer,
    AnimateurSerializer, AnimateurCreateSerializer,
    PoleSerializer
)
from api.filters import MentorFilter, YoungRequestFilter, MentoratFilter, AnimateurFilter


class PoleViewSet(viewsets.ModelViewSet):
    """ViewSet pour les pôles"""
    queryset = Pole.objects.all()
    serializer_class = PoleSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['code', 'name']
    ordering_fields = ['code', 'name', 'created_at']
    lookup_field = 'pk'

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsCN()]
        # list and retrieve are readable by any authenticated user (ACP needs pole list)
        return [IsAuthenticated()]

    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        """Dashboard d'un pôle spécifique"""
        pole = self.get_object()
        user = request.user
        
        if not hasattr(user, 'cn_member'):
            if not hasattr(user, 'animateur') or not user.animateur.pole_id:
                return Response(
                    {'error': 'Vous n\'êtes pas assigné à un pôle'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            if user.animateur.pole_id != pole.id:
                return Response(
                    {'error': 'Vous n\'avez pas accès à ce pôle'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        associations_count = Animateur.objects.filter(pole=pole).count()
        total_youngs = YoungRequest.objects.filter(pole=pole).count()
        active_mentorships = Mentorat.objects.filter(pole=pole, status='active').count()
        completed_mentorships = Mentorat.objects.filter(pole=pole, status='completed').count()
        pending_matches = YoungRequest.objects.filter(pole=pole, status='pending').count()
        alert_count = Mentorat.objects.filter(pole=pole, alerte_rouge=True).count()
        mentors_total = Mentor.objects.filter(pole=pole).count()
        mentors_active = Mentor.objects.filter(pole=pole, disponibilite_reelle__gt=0, is_active=True).count()
        
        recent_activities = []
        recent_youngs = YoungRequest.objects.filter(pole=pole).order_by('-created_at')[:5]
        for young in recent_youngs:
            recent_activities.append({
                'id': f"young_{young.id}",
                'type': 'registration',
                'description': f"Nouvelle demande: {young.first_name} {young.last_name}",
                'date': young.created_at.isoformat() if hasattr(young.created_at, 'isoformat') else str(young.created_at),
                'user_name': 'Système'
            })
        
        recent_mentorats = Mentorat.objects.filter(pole=pole).order_by('-created_at')[:5]
        for mentorat in recent_mentorats:
            mentor_name = f"{mentorat.mentor.first_name} {mentorat.mentor.last_name}" if mentorat.mentor else 'Inconnu'
            young_name = f"{mentorat.young_request.first_name} {mentorat.young_request.last_name}" if mentorat.young_request else 'Inconnu'
            recent_activities.append({
                'id': f"match_{mentorat.id}",
                'type': 'match',
                'description': f"Nouveau mentorat: {mentor_name} & {young_name}",
                'date': mentorat.created_at.isoformat() if hasattr(mentorat.created_at, 'isoformat') else str(mentorat.created_at),
                'user_name': 'Système'
            })
        
        recent_activities.sort(key=lambda x: x['date'], reverse=True)
        recent_activities = recent_activities[:10]
        
        return Response({
            'id': pole.id,
            'name': pole.name,
            'villes': pole.villes if isinstance(pole.villes, list) else [],
            'code': pole.code,
            'associations_count': associations_count,
            'total_youngs': total_youngs,
            'active_mentorships': active_mentorships,
            'completed_mentorships': completed_mentorships,
            'pending_matches': pending_matches,
            'alert_count': alert_count,
            'mentors_total': mentors_total,
            'mentors_active': mentors_active,
            'recent_activities': recent_activities,
        })


class MentorViewSet(viewsets.ModelViewSet):
    """ViewSet pour les mentors"""
    queryset = Mentor.objects.select_related('pole', 'association', 'user')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = MentorFilter
    search_fields = ['first_name', 'last_name', 'email']
    ordering_fields = ['last_name', 'disponibilite_reelle', 'created_at']
    lookup_field = 'pk'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return MentorListSerializer
        if self.action == 'create':
            return MentorCreateSerializer
        return MentorSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsACP()]
        if self.action in ['stats', 'mentorships', 'disponibles', 'available', 'me', 'update_profile']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'cn_member'):
            return self.queryset
        if hasattr(user, 'animateur') and user.animateur.is_acp:
            return self.queryset.filter(pole=user.animateur.pole)
        if hasattr(user, 'animateur'):
            return self.queryset.filter(association=user.animateur.association)
        if hasattr(user, 'mentor'):
            return self.queryset.filter(id=user.mentor.id)
        return self.queryset.none()
    
    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """Récupère le profil du mentor connecté"""
        user = request.user
        if not hasattr(user, 'mentor'):
            return Response(
                {'error': 'Vous n\'êtes pas un mentor'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        mentor = user.mentor
        return Response({
            'id': mentor.id,
            'first_name': mentor.first_name,
            'last_name': mentor.last_name,
            'email': mentor.email,
            'phone': mentor.phone,
            'pole': {
                'id': mentor.pole.id,
                'name': mentor.pole.name,
                'code': mentor.pole.code,
            },
            'association': {
                'id': mentor.association.id,
                'name': mentor.association.name,
                'code': mentor.association.code,
            },
            'max_capacity': mentor.max_capacity,
            'disponibilite_reelle': mentor.disponibilite_reelle,
            'is_active': mentor.is_active,
            'is_trained': mentor.is_trained,
        })
    
    @action(detail=False, methods=['patch', 'put'], url_path='update-profile')
    def update_profile(self, request):
        """Permet au mentor de modifier ses informations"""
        user = request.user
        if not hasattr(user, 'mentor'):
            return Response(
                {'error': 'Vous n\'êtes pas un mentor'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        mentor = user.mentor
        allowed_fields = ['first_name', 'last_name', 'phone', 'email']
        
        for field in allowed_fields:
            if field in request.data:
                setattr(mentor, field, request.data[field])
        
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        if 'email' in request.data:
            user.email = request.data['email']
            mentor.email = request.data['email']
        
        user.save()
        mentor.save()
        
        return Response({
            'success': True,
            'message': 'Profil mis à jour',
            'mentor': {
                'id': mentor.id,
                'first_name': mentor.first_name,
                'last_name': mentor.last_name,
                'email': mentor.email,
                'phone': mentor.phone,
            }
        })
    
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Stats pour le dashboard mentor"""
        user = request.user
        if not hasattr(user, 'mentor'):
            return Response(
                {'error': 'Vous devez être un mentor pour accéder à ces stats'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        mentor = user.mentor
        total_mentorships = Mentorat.objects.filter(mentor=mentor).count()
        active_mentorships = Mentorat.objects.filter(mentor=mentor, status='active').count()
        completed_mentorships = Mentorat.objects.filter(mentor=mentor, status='completed').count()
        pending_requests = Mentorat.objects.filter(mentor=mentor, status='pending').count()
        upcoming_meetings = 0
        
        active_mentorats = Mentorat.objects.filter(mentor=mentor, status='active')
        if active_mentorats.exists():
            total_progress = 0
            count = 0
            for m in active_mentorats:
                progress = getattr(m, 'progress_percentage', None) or getattr(m, 'completion_rate', None) or 50
                total_progress += progress
                count += 1
            average_progress = round(total_progress / count, 1) if count > 0 else 0
        else:
            average_progress = 0
        
        return Response({
            'total_mentorships': total_mentorships,
            'active_mentorships': active_mentorships,
            'completed_mentorships': completed_mentorships,
            'pending_requests': pending_requests,
            'upcoming_meetings': upcoming_meetings,
            'average_progress': average_progress
        })

    @action(detail=False, methods=['get'], url_path='mentorships')
    def mentorships(self, request):
        """Liste des mentorats du mentor connecté"""
        user = request.user
        if not hasattr(user, 'mentor'):
            return Response(
                {'error': 'Vous devez être un mentor pour accéder à ces données'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        mentor = user.mentor
        mentorats = Mentorat.objects.filter(mentor=mentor).select_related('young_request').order_by('-created_at')
        
        data = []
        for mentorat in mentorats:
            young = mentorat.young_request
            
            data.append({
                'id': mentorat.id,
                'apprentice_name': f"{young.first_name} {young.last_name}" if young else 'Inconnu',
                'apprentice_email': young.email if young else '',
                'status': mentorat.status,
                'start_date': mentorat.assigned_at.isoformat() if mentorat.assigned_at else mentorat.created_at.isoformat(),
                'end_date': mentorat.end_date.isoformat() if getattr(mentorat, 'end_date', None) else None,
                'next_meeting': None,
                'total_meetings': 0,
                'objectives_progress': getattr(mentorat, 'progress_percentage', 50) or 50
            })
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        """Liste des mentors disponibles"""
        mentors = self.get_queryset().filter(disponibilite_reelle__gt=0, is_active=True)
        page = self.paginate_queryset(mentors)
        serializer = MentorListSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Alias de disponibles"""
        return self.disponibles(request)
    
    @action(detail=True, methods=['post'])
    def liberer_place(self, request, pk=None):
        """Libère une place"""
        mentor = self.get_object()
        mentor.disponibilite_reelle = min(mentor.disponibilite_reelle + 1, mentor.max_capacity)
        mentor.save()
        return Response({
            'success': True,
            'disponibilite_reelle': mentor.disponibilite_reelle
        })


class YoungRequestViewSet(viewsets.ModelViewSet):
    """ViewSet pour les demandes jeunes"""
    queryset = YoungRequest.objects.select_related('pole', 'department', 'etablissement')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = YoungRequestFilter
    search_fields = ['first_name', 'last_name', 'email', 'city']
    ordering_fields = ['created_at', 'status']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return YoungRequestListSerializer
        if self.action == 'create':
            return YoungRequestCreateSerializer
        return YoungRequestSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return []
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return self.queryset.none()
        if hasattr(user, 'cn_member'):
            return self.queryset
        if hasattr(user, 'animateur') and user.animateur.is_acp:
            return self.queryset.filter(pole=user.animateur.pole)
        if hasattr(user, 'animateur'):
            return self.queryset.filter(pole=user.animateur.pole)
        return self.queryset.none()

    @action(detail=False, methods=['get'])
    def matching(self, request):
        """Liste des demandes en attente de matching"""
        user = request.user
        if not hasattr(user, 'cn_member'):
            if not hasattr(user, 'animateur') or not user.animateur.is_acp:
                return Response(
                    {'error': 'Seuls les coordinateurs de pôle peuvent accéder au matching'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        queryset = self.get_queryset().filter(status__in=['NEW', 'PENDING']).order_by('-created_at')
        page = self.paginate_queryset(queryset)
        serializer = YoungRequestListSerializer(page or queryset, many=True)
        
        if page:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def assigner_pole(self, request, pk=None):
        """Assigne un pôle à une demande"""
        demande = self.get_object()
        pole_id = request.data.get('pole_id')
        if not pole_id:
            return Response({'error': 'pole_id requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            pole = Pole.objects.get(id=pole_id)
            demande.pole = pole
            demande.status = 'PENDING'
            demande.save()
            return Response({
                'success': True,
                'message': f'Demandé assignée au pôle {pole.name}'
            })
        except Pole.DoesNotExist:
            return Response({'error': 'Pôle introuvable'}, status=status.HTTP_404_NOT_FOUND)


class MentoratViewSet(viewsets.ModelViewSet):
    """ViewSet pour les mentorats"""
    queryset = Mentorat.objects.select_related('mentor', 'young_request', 'pole', 'ap_responsable')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = MentoratFilter
    search_fields = ['mentor__first_name', 'mentor__last_name', 
                     'young_request__first_name', 'young_request__last_name']
    ordering_fields = ['created_at', 'assigned_at', 'status']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return MentoratListSerializer
        if self.action == 'create':
            return MentoratCreateSerializer
        return MentoratSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsACP()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsACP()]
        # ✅ AJOUTÉ : Permettre au mentor de gérer ses mentorats
        if self.action in ['cloturer', 'stop', 'ajouter_suivi', 'suivis']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'cn_member'):
            return self.queryset
        if hasattr(user, 'animateur') and user.animateur.is_acp:
            return self.queryset.filter(pole=user.animateur.pole)
        if hasattr(user, 'animateur'):
            return self.queryset.filter(
                models.Q(ap_responsable=user.animateur) |
                models.Q(mentor__association=user.animateur.association)
            )
        if hasattr(user, 'mentor'):
            return self.queryset.filter(mentor=user.mentor)
        return self.queryset.none()
    
    # ✅ NOUVEAU : Ajouter un suivi avec validation date
    @action(detail=True, methods=['post'])
    def ajouter_suivi(self, request, pk=None):
        """Ajoute un suivi/rencontre au mentorat"""
        mentorat = self.get_object()
        user = request.user
        
        # Vérifier que c'est bien le mentor du mentorat
        if hasattr(user, 'mentor') and mentorat.mentor != user.mentor:
            return Response(
                {'error': 'Vous ne pouvez ajouter des suivis que pour vos propres mentorats'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        date_rencontre = request.data.get('date_rencontre')
        duree_minutes = request.data.get('duree_minutes', 60)
        type_rencontre = request.data.get('type_rencontre', 'PRESENTIEL')
        objectifs_atteints = request.data.get('objectifs_atteints', False)
        notes = request.data.get('notes', '')
        
        # ✅ SÉCURITÉ : Vérifier que la date n'est pas dans le futur
        from datetime import datetime, date
        if date_rencontre:
            try:
                if isinstance(date_rencontre, str):
                    date_parsed = datetime.strptime(date_rencontre, '%Y-%m-%d').date()
                else:
                    date_parsed = date_rencontre
                
                if date_parsed > date.today():
                    return Response(
                        {'error': 'La date de rencontre ne peut pas être dans le futur'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except ValueError:
                return Response(
                    {'error': 'Format de date invalide (YYYY-MM-DD attendu)'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Créer le suivi
        suivi = SuiviMentorat.objects.create(
            mentorat=mentorat,
            date_rencontre=date_rencontre,
            duree_minutes=duree_minutes,
            type_rencontre=type_rencontre,
            objectifs_atteints=objectifs_atteints,
            notes=notes
        )
        
        # Mettre à jour le dernier contact du mentorat
        mentorat.dernier_contact = date_rencontre
        mentorat.save()
        
        # Calculer les stats mises à jour
        suivis = SuiviMentorat.objects.filter(mentorat=mentorat)
        stats = {
            'nb_rencontres': suivis.count(),
            'total_minutes': sum(s.duree_minutes for s in suivis),
            'total_heures': round(sum(s.duree_minutes for s in suivis) / 60, 1)
        }
        
        return Response({
            'success': True,
            'suivi': {
                'id': suivi.id,
                'date_rencontre': suivi.date_rencontre,
                'duree_minutes': suivi.duree_minutes,
                'type_rencontre': suivi.type_rencontre,
                'type_rencontre_label': suivi.get_type_rencontre_display(),
                'objectifs_atteints': suivi.objectifs_atteints,
                'notes': suivi.notes,
            },
            'stats': stats
        })
    
    # ✅ NOUVEAU : Lister les suivis d'un mentorat
    @action(detail=True, methods=['get'])
    def suivis(self, request, pk=None):
        """Liste tous les suivis d'un mentorat"""
        mentorat = self.get_object()
        user = request.user
        
        # Vérifier permissions
        is_mentor = hasattr(user, 'mentor') and mentorat.mentor == user.mentor
        is_acp = hasattr(user, 'animateur') and user.animateur.is_acp
        is_cn = hasattr(user, 'cn_member')
        
        if not (is_mentor or is_acp or is_cn):
            return Response(
                {'error': 'Accès non autorisé'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        suivis_list = SuiviMentorat.objects.filter(mentorat=mentorat).order_by('-date_rencontre')
        
        data = []
        for s in suivis_list:
            data.append({
                'id': s.id,
                'date_rencontre': s.date_rencontre,
                'duree_minutes': s.duree_minutes,
                'type_rencontre': s.type_rencontre,
                'type_rencontre_label': s.get_type_rencontre_display(),
                'objectifs_atteints': s.objectifs_atteints,
                'notes': s.notes,
            })
        
        # Calculer les stats
        total_minutes = sum(s.duree_minutes for s in suivis_list)
        
        return Response({
            'suivis': data,
            'stats': {
                'nb_rencontres': len(data),
                'total_minutes': total_minutes,
                'total_heures': round(total_minutes / 60, 1)
            }
        })
    
    @action(detail=True, methods=['post'])
    def signaler_alerte(self, request, pk=None):
        """Signale une alerte rouge"""
        mentorat = self.get_object()
        mentorat.alerte_rouge = True
        mentorat.save()
        return Response({'success': True, 'alerte_rouge': True})
    
    @action(detail=True, methods=['post'])
    def resoudre_alerte(self, request, pk=None):
        """Résout l'alerte rouge"""
        mentorat = self.get_object()
        mentorat.alerte_rouge = False
        mentorat.save()
        return Response({'success': True, 'alerte_rouge': False})
    
    # ✅ CORRIGÉ : Cloturer avec stats des suivis
    @action(detail=True, methods=['post'])
    def cloturer(self, request, pk=None):
        """Clôture le mentorat (succès) avec stats"""
        mentorat = self.get_object()
        user = request.user
        
        # Vérifier permissions
        is_mentor = hasattr(user, 'mentor') and mentorat.mentor == user.mentor
        is_acp = hasattr(user, 'animateur') and user.animateur.is_acp
        is_cn = hasattr(user, 'cn_member')
        
        if not (is_mentor or is_acp or is_cn):
            return Response(
                {'error': 'Vous ne pouvez clôturer que vos propres mentorats'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reason = request.data.get('reason', '')
        
        # ✅ Récupérer les stats avant clôture
        suivis = SuiviMentorat.objects.filter(mentorat=mentorat)
        nb_rencontres = suivis.count()
        total_minutes = sum(s.duree_minutes for s in suivis)
        
        # Clôturer
        mentorat.status = 'completed'
        mentorat.end_date = timezone.now()
        mentorat.closure_reason = reason
        mentorat.save()
        
        # Libérer la place
        mentor = mentorat.mentor
        if mentor:
            mentor.disponibilite_reelle = min(mentor.disponibilite_reelle + 1, mentor.max_capacity)
            mentor.save()
        
        return Response({
            'success': True,
            'message': 'Mentorat clôturé avec succès',
            'status': mentorat.status,
            'end_date': mentorat.end_date,
            'suivi_stats': {
                'nb_rencontres': nb_rencontres,
                'total_minutes': total_minutes,
                'total_heures': round(total_minutes / 60, 1),
                'duree_totale_formatee': f"{total_minutes // 60}h{total_minutes % 60}min" if total_minutes else "0h"
            }
        })
    
    # ✅ NOUVEAU : Arrêter un mentorat (abandon) avec stats
    @action(detail=True, methods=['post'])
    def stop(self, request, pk=None):
        """Arrête le mentorat (abandon/échec) avec stats"""
        mentorat = self.get_object()
        user = request.user
        
        is_mentor = hasattr(user, 'mentor') and mentorat.mentor == user.mentor
        is_acp = hasattr(user, 'animateur') and user.animateur.is_acp
        is_cn = hasattr(user, 'cn_member')
        
        if not (is_mentor or is_acp or is_cn):
            return Response(
                {'error': 'Vous ne pouvez arrêter que vos propres mentorats'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reason = request.data.get('reason', 'Arrêt par le mentor')
        
        # ✅ Stats avant arrêt
        suivis = SuiviMentorat.objects.filter(mentorat=mentorat)
        nb_rencontres = suivis.count()
        total_minutes = sum(s.duree_minutes for s in suivis)
        
        mentorat.status = 'stopped'
        mentorat.end_date = timezone.now()
        mentorat.closure_reason = reason
        mentorat.save()
        
        mentor = mentorat.mentor
        if mentor:
            mentor.disponibilite_reelle = min(mentor.disponibilite_reelle + 1, mentor.max_capacity)
            mentor.save()
        
        return Response({
            'success': True,
            'message': 'Mentorat arrêté',
            'status': mentorat.status,
            'reason': reason,
            'end_date': mentorat.end_date,
            'suivi_stats': {
                'nb_rencontres': nb_rencontres,
                'total_minutes': total_minutes,
                'total_heures': round(total_minutes / 60, 1),
                'duree_totale_formatee': f"{total_minutes // 60}h{total_minutes % 60}min" if total_minutes else "0h"
            }
        })


    @action(detail=True, methods=['get'], url_path='financements-list')
    def list_financements(self, request, pk=None):
        """Liste les financeurs d'un mentorat."""
        mentorat = self.get_object()
        mfs = MentoratFinancement.objects.filter(mentorat=mentorat).select_related('financement')
        data = [{
            'id':               mf.id,
            'financement_id':   mf.financement.id,
            'financement_nom':  mf.financement.nom,
            'financement_code': mf.financement.code,
            'type':             mf.financement.type,
            'type_label':       mf.financement.get_type_display(),
            'code_specifique':  mf.code_specifique,
            'added_at':         mf.added_at,
        } for mf in mfs]
        return Response({'financements': data})

    @action(detail=True, methods=['post'], url_path='add_financement',
            permission_classes=[IsAuthenticated, IsACP])
    def add_financement(self, request, pk=None):
        """Ajoute un financeur à un mentorat."""
        mentorat = self.get_object()
        financement_id = request.data.get('financement_id')
        code_specifique = request.data.get('code_specifique', '').strip()

        if not financement_id:
            return Response({'error': 'financement_id requis'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            financement = Financement.objects.get(pk=financement_id)
        except Financement.DoesNotExist:
            return Response({'error': 'Financement introuvable'}, status=status.HTTP_404_NOT_FOUND)

        mf, created = MentoratFinancement.objects.get_or_create(
            mentorat=mentorat,
            financement=financement,
            defaults={'code_specifique': code_specifique},
        )
        if not created and code_specifique:
            mf.code_specifique = code_specifique
            mf.save()

        return Response({
            'id':              mf.id,
            'financement_id':  financement.id,
            'financement_nom': financement.nom,
            'financement_code': financement.code,
            'type':            financement.type,
            'code_specifique': mf.code_specifique,
            'added_at':        mf.added_at,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['delete'], url_path=r'financements/(?P<mf_id>\d+)',
            permission_classes=[IsAuthenticated, IsACP])
    def remove_financement(self, request, pk=None, mf_id=None):
        """Retire un financeur d'un mentorat."""
        mentorat = self.get_object()
        try:
            mf = MentoratFinancement.objects.get(pk=mf_id, mentorat=mentorat)
        except MentoratFinancement.DoesNotExist:
            return Response({'error': 'Financement introuvable sur ce mentorat'}, status=status.HTTP_404_NOT_FOUND)
        mf.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AnimateurViewSet(viewsets.ModelViewSet):
    """ViewSet pour les animateurs"""
    queryset = Animateur.objects.select_related('user', 'pole', 'association')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = AnimateurFilter
    search_fields = ['first_name', 'last_name', 'email']
    ordering_fields = ['last_name', 'created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AnimateurCreateSerializer
        return AnimateurSerializer
    
    def get_permissions(self):
        return [IsAuthenticated(), IsACP()]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'cn_member'):
            return self.queryset
        if hasattr(user, 'animateur') and user.animateur.is_acp:
            return self.queryset.filter(pole=user.animateur.pole)
        return self.queryset.none()