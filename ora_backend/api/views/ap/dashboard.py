# api/views/ap/dashboard.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Sum, Max, Q
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import date, timedelta

from core.models import Mentor, Mentorat, SuiviMentorat, YoungRequest, EvaluationMentor, Etablissement
from api.permissions import IsAP, IsACP, IsCN

# ─────────────────────────────────────────────────────────────
# CONSTANTES
# ─────────────────────────────────────────────────────────────
SEUIL_ALERTE_JOURS = 30   # Pas de contact depuis X jours → alerte
SEUIL_WARN_JOURS   = 21   # Pas de contact depuis X jours → avertissement


def _is_ap_or_acp(user):
    """Retourne True si l'user est AP ou ACP (animateur actif)."""
    return hasattr(user, 'animateur') and user.animateur.is_active


def _get_animateur(user):
    """Raccourci sécurisé."""
    return getattr(user, 'animateur', None)


# ─────────────────────────────────────────────────────────────
# SÉRIALISATION
# ─────────────────────────────────────────────────────────────
def serialize_suivi_stats(mentorat):
    """Stats rencontres pour un mentorat."""
    agg = SuiviMentorat.objects.filter(mentorat=mentorat).aggregate(
        nb=Count('id'),
        total_minutes=Sum('duree_minutes'),
        last_date=Max('date_rencontre'),
    )
    nb    = agg['nb'] or 0
    total = agg['total_minutes'] or 0
    last  = agg['last_date']
    return {
        'nb_rencontres':  nb,
        'total_minutes':  total,
        'total_heures':   round(total / 60, 1),
        'last_rencontre': last,
    }


def compute_inactivite(last_date):
    """
    Retourne le nombre de jours sans contact et le niveau d'alerte.
    level: 'ok' | 'warn' | 'alert'
    """
    if last_date is None:
        return {'jours': None, 'level': 'ok'}  # Pas encore de rencontre → pas d'alerte

    jours = (date.today() - last_date).days
    if jours >= SEUIL_ALERTE_JOURS:
        level = 'alert'
    elif jours >= SEUIL_WARN_JOURS:
        level = 'warn'
    else:
        level = 'ok'
    return {'jours': jours, 'level': level}


_STATUS_LABELS = {
    'PENDING': 'En attente',
    'ACTIVE':  'Actif',
    'CLOSED':  'Clôturé',
    'ABORTED': 'Abandonné',
}


def serialize_mentorat_for_ap(m: Mentorat):
    """Sérialise un mentorat pour la vue AP (lecture seule)."""
    stats = serialize_suivi_stats(m)
    inactivite = compute_inactivite(stats['last_rencontre'])

    young = m.young_request
    return {
        'id':           m.id,
        'status':       m.status,
        'date_debut':   m.assigned_at,
        'alerte_rouge': m.alerte_rouge,
        'inactivite':   inactivite,
        'jeune': {
            'id':                young.id,
            'name':              f"{young.first_name} {young.last_name}",
            'email':             young.email,
            'phone':             young.phone,
            'city':              young.city,
            'needs_description': young.needs_description,
            'urgency_level':     young.urgency_level,
        } if young else None,
        'suivi_stats': stats,
    }


def serialize_mesmentorat(m: Mentorat):
    """Sérialise un mentorat du point de vue de l'AP qui en est responsable."""
    stats = serialize_suivi_stats(m)
    inactivite = compute_inactivite(stats['last_rencontre'])
    mentor = m.mentor
    young = m.young_request
    return {
        'id':           m.id,
        'status':       m.status,
        'status_label': _STATUS_LABELS.get(m.status, m.status),
        'assigned_at':  m.assigned_at,
        'alerte_rouge': m.alerte_rouge,
        'inactivite':   inactivite,
        'mentor': {
            'id':          mentor.id,
            'name':        f"{mentor.first_name} {mentor.last_name}",
            'association': mentor.association.name,
            'city':        mentor.city,
            'is_trained':  mentor.is_trained,
        },
        'jeune': {
            'name':              f"{young.first_name} {young.last_name}",
            'city':              young.city,
            'diplome_label':     young.get_diplome_prepare_display() if young.diplome_prepare else '',
            'situation':         young.situation or '',
            'situation_label':   young.get_situation_display() if young.situation else '',
            'etablissement_id':  young.etablissement_id,
            'nom_etablissement': (
                young.etablissement.nom if young.etablissement_id else young.nom_etablissement
            ) or '',
        } if young else None,
        'suivi_stats': stats,
        # Demande de clôture en attente
        'cloture_en_attente':         m.cloture_en_attente,
        'cloture_action_demandee':    m.cloture_action_demandee,
        'cloture_reason_demandee':    m.cloture_reason_demandee,
        'cloture_message_demandee':   m.cloture_message_demandee,
    }


def serialize_mentor_for_ap(mentor: Mentor):
    """
    Sérialise un mentor avec ses mentorats actifs et ses stats.
    Inclut le calcul d'alerte d'inactivité.
    """
    mentorats_actifs = (
        Mentorat.objects.filter(mentor=mentor, status='ACTIVE')
        .select_related('young_request')
        .prefetch_related('suivis')
    )

    # Dernière rencontre TOUS mentorats confondus pour ce mentor
    global_last = SuiviMentorat.objects.filter(
        mentorat__mentor=mentor,
        mentorat__status='ACTIVE',
    ).aggregate(last=Max('date_rencontre'))['last']

    global_inactivite = compute_inactivite(global_last)

    return {
        'id':           mentor.id,
        'first_name':   mentor.first_name,
        'last_name':    mentor.last_name,
        'email':        mentor.email,
        'phone':        mentor.phone,
        'city':         mentor.city,
        'is_trained':   mentor.is_trained,
        'is_active':    mentor.is_active,
        'capacite': {
            'max':        mentor.max_capacity,
            'disponible': mentor.disponibilite_reelle,
            'utilisee':   mentor.max_capacity - mentor.disponibilite_reelle,
        },
        'derniere_activite': {
            'date':  global_last,
            **global_inactivite,
        },
        'mentorats_actifs': [serialize_mentorat_for_ap(m) for m in mentorats_actifs],
        'nb_mentorats_actifs':   mentorats_actifs.count(),
        'nb_mentorats_termines': Mentorat.objects.filter(
            mentor=mentor, status__in=['CLOSED', 'ABORTED']
        ).count(),
    }


# ─────────────────────────────────────────────────────────────
# VUE 1 : Dashboard AP
# ─────────────────────────────────────────────────────────────
class APDashboardView(APIView):
    """
    Dashboard de l'AP : vue de son association.
    Accessible aussi par ACP (is_coordinator=True) et CN.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        animateur = _get_animateur(user)

        # ── Contrôle d'accès ──────────────────────────────────
        if not animateur and not hasattr(user, 'cn_member'):
            return Response(
                {'error': 'Accès réservé aux animateurs.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # ── Scope association ──────────────────────────────────
        # AP voit son association | ACP peut voir une asso spécifique via ?association_id=
        # CN peut voir toutes les assos via ?association_id=
        if animateur:
            association = animateur.association
        else:
            # CN : doit passer ?association_id=
            association_id = request.query_params.get('association_id')
            if not association_id:
                return Response(
                    {'error': 'Paramètre association_id requis pour CN.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            from core.models import Association
            try:
                association = Association.objects.get(id=association_id)
            except Association.DoesNotExist:
                return Response({'error': 'Association introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        # ── Mentors de l'association ───────────────────────────
        mentors = Mentor.objects.filter(
            association=association,
            is_active=True,
        ).select_related('department')

        # ── Agrégats globaux ──────────────────────────────────
        total_mentors     = mentors.count()
        mentors_disponibles = mentors.filter(disponibilite_reelle__gt=0).count()
        mentorats_actifs  = Mentorat.objects.filter(
            mentor__association=association, status='ACTIVE'
        ).count()

        # Alertes actives (flag rouge OU inactivité > seuil)
        alertes_rouges = Mentorat.objects.filter(
            mentor__association=association,
            status='ACTIVE',
            alerte_rouge=True,
        ).count()

        seuil_date = date.today() - timedelta(days=SEUIL_ALERTE_JOURS)
        inactifs = SuiviMentorat.objects.filter(
            mentorat__mentor__association=association,
            mentorat__status='ACTIVE',
        ).values('mentorat__mentor_id').annotate(
            last=Max('date_rencontre')
        ).filter(last__lt=seuil_date)
        mentors_inactifs_count = inactifs.count()

        # ── Sérialisation mentors ──────────────────────────────
        mentors_data = [serialize_mentor_for_ap(m) for m in mentors]

        # ── Tri : alertes en premier, puis warn, puis ok ───────
        level_order = {'alert': 0, 'warn': 1, 'ok': 2}
        mentors_data.sort(key=lambda m: level_order.get(m['derniere_activite']['level'], 3))

        # ── Mes mentorats (où je suis AP responsable) ─────────
        mes_mentorats_qs = []
        mes_mentorats_actifs_count = 0
        mes_mentorats_total = 0
        clotures_en_attente_count = 0
        if animateur and not animateur.is_coordinator:
            mes_mentorats_qs = (
                Mentorat.objects
                .filter(ap_responsable=animateur)
                .select_related('mentor__association', 'young_request', 'young_request__etablissement')
                .order_by('-assigned_at')
            )
            mes_mentorats_actifs_count = mes_mentorats_qs.filter(status='ACTIVE').count()
            mes_mentorats_total = mes_mentorats_qs.count()
            clotures_en_attente_count = mes_mentorats_qs.filter(
                status='ACTIVE', cloture_en_attente=True
            ).count()

        mes_mentorats_data = [serialize_mesmentorat(m) for m in mes_mentorats_qs]

        return Response({
            'animateur': {
                'id':             animateur.id if animateur else None,
                'first_name':     animateur.first_name if animateur else user.first_name,
                'last_name':      animateur.last_name if animateur else user.last_name,
                'role':           'ACP' if (animateur and animateur.is_coordinator) else 'AP',
                'association': {
                    'id':   association.id,
                    'name': association.name,
                    'code': association.code,
                },
                'pole': {
                    'id':   animateur.pole.id if animateur else None,
                    'name': animateur.pole.name if animateur else None,
                    'code': animateur.pole.code if animateur else None,
                },
            },
            'stats': {
                'total_mentors':              total_mentors,
                'mentors_disponibles':        mentors_disponibles,
                'mentorats_actifs':           mentorats_actifs,
                'alertes_rouges':             alertes_rouges,
                'mentors_inactifs':           mentors_inactifs_count,
                'mes_mentorats_actifs':       mes_mentorats_actifs_count,
                'mes_mentorats_total':        mes_mentorats_total,
                'clotures_en_attente':        clotures_en_attente_count,
            },
            'mentors':      mentors_data,
            'mes_mentorats': mes_mentorats_data,
        })


# ─────────────────────────────────────────────────────────────
# VUE 2 : Détail d'un mentor (pour l'AP)
# ─────────────────────────────────────────────────────────────
class APMentorDetailView(APIView):
    """
    Détail complet d'un mentor, accessible par l'AP de son association,
    l'ACP du pôle ou CN.
    """
    permission_classes = [IsAuthenticated]

    def _check_access(self, request, mentor):
        user = request.user
        if hasattr(user, 'cn_member'):
            return True
        animateur = _get_animateur(user)
        if not animateur:
            return False
        # ACP : son pôle
        if animateur.is_coordinator:
            return mentor.pole_id == animateur.pole_id
        # AP : son association OU AP responsable d'au moins un mentorat de ce mentor
        if mentor.association_id == animateur.association_id:
            return True
        return Mentorat.objects.filter(mentor=mentor, ap_responsable=animateur).exists()

    def get(self, request, mentor_id):
        try:
            mentor = Mentor.objects.select_related(
                'association', 'pole', 'department'
            ).get(id=mentor_id)
        except Mentor.DoesNotExist:
            return Response({'error': 'Mentor introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if not self._check_access(request, mentor):
            return Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        # Mentorats actifs + historique
        mentorats_actifs = Mentorat.objects.filter(
            mentor=mentor, status='ACTIVE'
        ).select_related('young_request')

        historique = Mentorat.objects.filter(
            mentor=mentor, status__in=['CLOSED', 'ABORTED']
        ).select_related('young_request').order_by('-closed_at')[:10]

        return Response({
            'mentor': serialize_mentor_for_ap(mentor),
            'historique': [
                {
                    'id':             m.id,
                    'jeune':          f"{m.young_request.first_name} {m.young_request.last_name}" if m.young_request else '—',
                    'statut_final':   m.status,
                    'date_fin':       m.closed_at,
                    'closure_reason': m.closure_reason,
                    'suivi_stats':    serialize_suivi_stats(m),
                }
                for m in historique
            ],
        })


# ─────────────────────────────────────────────────────────────
# VUE 3 : Signaler / Résoudre une alerte sur un mentorat
# ─────────────────────────────────────────────────────────────
class APMentoratAlerteView(APIView):
    """
    L'AP peut signaler ou résoudre une alerte rouge sur un mentorat
    de son association.
    POST { "action": "signaler" | "resoudre", "note": "..." }
    """
    permission_classes = [IsAuthenticated]

    def _check_access(self, request, mentorat):
        user = request.user
        if hasattr(user, 'cn_member'):
            return True
        animateur = _get_animateur(user)
        if not animateur:
            return False
        if animateur.is_coordinator:
            return mentorat.pole_id == animateur.pole_id
        # AP : son association OU AP responsable de ce mentorat
        return (mentorat.mentor.association_id == animateur.association_id or
                mentorat.ap_responsable_id == animateur.id)

    def post(self, request, mentorat_id):
        try:
            mentorat = Mentorat.objects.select_related('mentor').get(
                id=mentorat_id, status='ACTIVE'
            )
        except Mentorat.DoesNotExist:
            return Response({'error': 'Mentorat introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if not self._check_access(request, mentorat):
            return Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action')
        note   = request.data.get('note', '')

        if action == 'signaler':
            mentorat.alerte_rouge = True
            if note:
                prefix = f"[AP - {date.today()}] {note}\n"
                mentorat.notes_suivi = prefix + (mentorat.notes_suivi or '')
            mentorat.save()
            return Response({'success': True, 'alerte_rouge': True})

        elif action == 'resoudre':
            mentorat.alerte_rouge = False
            if note:
                prefix = f"[AP résolu - {date.today()}] {note}\n"
                mentorat.notes_suivi = prefix + (mentorat.notes_suivi or '')
            mentorat.save()
            return Response({'success': True, 'alerte_rouge': False})

        return Response({'error': 'action doit être "signaler" ou "resoudre".'}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────
# VUE 4 : Notes de suivi AP sur un mentorat
# ─────────────────────────────────────────────────────────────
class APMentoratNotesView(APIView):
    """
    PATCH : Ajoute/met à jour les notes de suivi de l'AP sur un mentorat.
    """
    permission_classes = [IsAuthenticated]

    def _check_access(self, request, mentorat):
        user = request.user
        if hasattr(user, 'cn_member'):
            return True
        animateur = _get_animateur(user)
        if not animateur:
            return False
        if animateur.is_coordinator:
            return mentorat.pole_id == animateur.pole_id
        # AP : son association OU AP responsable de ce mentorat
        return (mentorat.mentor.association_id == animateur.association_id or
                mentorat.ap_responsable_id == animateur.id)

    def patch(self, request, mentorat_id):
        try:
            mentorat = Mentorat.objects.select_related('mentor').get(id=mentorat_id)
        except Mentorat.DoesNotExist:
            return Response({'error': 'Mentorat introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if not self._check_access(request, mentorat):
            return Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        notes = request.data.get('notes_suivi')
        if notes is None:
            return Response({'error': 'Le champ notes_suivi est requis.'}, status=status.HTTP_400_BAD_REQUEST)

        mentorat.notes_suivi = notes
        mentorat.save()
        return Response({'success': True, 'notes_suivi': mentorat.notes_suivi})


# ─────────────────────────────────────────────────────────────
# VUE 5 : Confirmer ou rejeter une demande de clôture (AP/ACP)
# ─────────────────────────────────────────────────────────────
class APConfirmerClotureView(APIView):
    """
    POST /ap/mentorats/{id}/confirmer-cloture/
    { "action": "confirm" | "reject" }

    AP ou ACP confirme ou rejette une demande de clôture émise par le mentor.
    Sur confirmation : clôture effective + email au jeune + création token évaluation.
    Sur rejet : réinitialise les flags, le mentorat reste ACTIVE.
    ACP peut accéder à tous les mentorats de son pôle (override).
    """
    permission_classes = [IsAuthenticated]

    def _check_access(self, request, mentorat):
        user = request.user
        animateur = _get_animateur(user)
        if not animateur:
            return False
        # ACP : son pôle entier
        if animateur.is_coordinator:
            return mentorat.pole_id == animateur.pole_id
        # AP : responsable de ce mentorat OU même association
        return (
            mentorat.ap_responsable_id == animateur.id or
            mentorat.mentor.association_id == animateur.association_id
        )

    def post(self, request, mentorat_id):
        try:
            mentorat = Mentorat.objects.select_related(
                'mentor', 'mentor__association', 'young_request', 'ap_responsable'
            ).get(id=mentorat_id, status='ACTIVE', cloture_en_attente=True)
        except Mentorat.DoesNotExist:
            return Response(
                {'error': 'Mentorat introuvable ou pas de demande de clôture en attente.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not self._check_access(request, mentorat):
            return Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action')
        if action not in ('confirm', 'reject'):
            return Response(
                {'error': 'action doit être "confirm" ou "reject".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action == 'reject':
            # Annuler la demande — le mentorat reste actif
            mentorat.cloture_en_attente = False
            mentorat.cloture_action_demandee = ''
            mentorat.cloture_reason_demandee = ''
            mentorat.cloture_message_demandee = ''
            mentorat.save(update_fields=[
                'cloture_en_attente', 'cloture_action_demandee',
                'cloture_reason_demandee', 'cloture_message_demandee',
            ])
            return Response({'success': True, 'action': 'rejected'})

        # ── Confirmer la clôture ──────────────────────────────
        statut_final  = mentorat.cloture_action_demandee or 'CLOSED'
        reason        = mentorat.cloture_reason_demandee
        message_jeune = mentorat.cloture_message_demandee

        # Effacer les flags avant la clôture pour éviter les conflits
        mentorat.cloture_en_attente = False
        mentorat.cloture_action_demandee = ''
        mentorat.cloture_reason_demandee = ''
        mentorat.cloture_message_demandee = ''
        mentorat.save(update_fields=[
            'cloture_en_attente', 'cloture_action_demandee',
            'cloture_reason_demandee', 'cloture_message_demandee',
        ])

        # Clôture effective (libère slot mentor + ferme demande)
        mentorat.cloturer(reason=reason, statut=statut_final)

        # Email de clôture au jeune
        jeune = mentorat.young_request
        if message_jeune and jeune and jeune.email:
            try:
                sujet = (
                    "Votre mentorat a été clôturé avec succès"
                    if statut_final == 'CLOSED'
                    else "Votre mentorat a pris fin"
                )
                send_mail(
                    subject=sujet,
                    message=message_jeune,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[jeune.email],
                    fail_silently=True,
                )
            except Exception:
                pass

        # Créer le token d'évaluation et envoyer le lien au jeune
        if jeune and jeune.email:
            try:
                evaluation = EvaluationMentor.create_for_mentorat(mentorat)
                frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
                eval_link = f"{frontend_url}/evaluer-mentor/{evaluation.token}"
                mentor_nom = f"{mentorat.mentor.first_name} {mentorat.mentor.last_name}"
                eval_message = (
                    f"Bonjour {jeune.first_name},\n\n"
                    f"Votre mentorat avec {mentor_nom} est maintenant terminé.\n\n"
                    f"Nous vous serions reconnaissants de prendre quelques instants pour évaluer "
                    f"votre expérience en cliquant sur le lien suivant :\n\n"
                    f"{eval_link}\n\n"
                    f"Votre avis nous aide à améliorer la qualité de notre programme de mentorat.\n\n"
                    f"Merci,\nL'équipe ORA"
                )
                send_mail(
                    subject="Évaluez votre expérience de mentorat",
                    message=eval_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[jeune.email],
                    fail_silently=True,
                )
            except Exception:
                pass

        return Response({
            'success':      True,
            'action':       'confirmed',
            'statut_final': statut_final,
        })


# ─────────────────────────────────────────────────────────────
# VUE 6 : Modifier la situation / établissement du jeune (AP/ACP)
# ─────────────────────────────────────────────────────────────
class APUpdateJeuneView(APIView):
    """
    PATCH /ap/mentorats/{id}/jeune/
    L'AP ou l'ACP peut mettre à jour la situation et le nom de l'établissement du jeune.
    """
    permission_classes = [IsAuthenticated]

    def _check_access(self, request, mentorat):
        user = request.user
        animateur = _get_animateur(user)
        if not animateur:
            return False
        if animateur.is_coordinator:
            return mentorat.pole_id == animateur.pole_id
        return (
            mentorat.ap_responsable_id == animateur.id or
            mentorat.mentor.association_id == animateur.association_id
        )

    def patch(self, request, mentorat_id):
        try:
            mentorat = Mentorat.objects.select_related(
                'mentor', 'young_request', 'young_request__etablissement'
            ).get(id=mentorat_id)
        except Mentorat.DoesNotExist:
            return Response({'error': 'Mentorat introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if not self._check_access(request, mentorat):
            return Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        req = mentorat.young_request
        updated = []

        if 'situation' in request.data:
            val = request.data['situation']
            if val not in ('apprentissage', 'recherche', ''):
                return Response({'error': 'Situation invalide.'}, status=status.HTTP_400_BAD_REQUEST)
            req.situation = val
            updated.append('situation')

        if 'etablissement_id' in request.data:
            etab_id = request.data['etablissement_id']
            if etab_id:
                if not Etablissement.objects.filter(id=etab_id, is_active=True).exists():
                    return Response({'error': 'Établissement introuvable.'}, status=status.HTTP_400_BAD_REQUEST)
                req.etablissement_id = etab_id
                req.nom_etablissement = ''
                updated.extend(['etablissement_id', 'nom_etablissement'])
            else:
                req.etablissement_id = None
                updated.append('etablissement_id')
        elif 'nom_etablissement' in request.data:
            req.nom_etablissement = str(request.data['nom_etablissement']).strip()
            req.etablissement_id = None
            updated.extend(['nom_etablissement', 'etablissement_id'])

        if updated:
            req.save(update_fields=list(set(updated)))

        return Response({
            'situation':        req.situation or '',
            'situation_label':  req.get_situation_display() if req.situation else '',
            'etablissement_id': req.etablissement_id,
            'nom_etablissement': (
                req.etablissement.nom if req.etablissement_id else req.nom_etablissement
            ) or '',
        })


# ─────────────────────────────────────────────────────────────
# VUE 7 : Liste des établissements du pôle (AP/ACP)
# ─────────────────────────────────────────────────────────────
class APEtablissementsView(APIView):
    """
    GET /ap/etablissements/  – liste des établissements du pôle de l'animateur (AP ou ACP)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        animateur = _get_animateur(request.user)
        if not animateur:
            return Response({'error': 'Pas de pôle'}, status=status.HTTP_400_BAD_REQUEST)
        etabs = Etablissement.objects.filter(
            pole_id=animateur.pole_id, is_active=True
        ).order_by('nom')
        return Response([
            {'id': e.id, 'nom': e.nom, 'code_postal': e.code_postal}
            for e in etabs
        ])
