# api/views/pole/mentors.py
import secrets
import string
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q

from core.models import Mentor, Association, Department, User
from api.permissions import IsAnimateur


def _generate_temp_password(length=12):
    chars = string.ascii_letters + string.digits + '!@#$%&*'
    return ''.join(secrets.choice(chars) for _ in range(length))


def _serialize_mentor(m):
    return {
        "id":              m.id,
        "name":            f"{m.first_name} {m.last_name}",
        "first_name":      m.first_name,
        "last_name":       m.last_name,
        "email":           m.email,
        "phone":           m.phone,
        "city":            m.city,
        "code_postal":     m.code_postal,
        "observations":    m.observations,
        "department":      m.department.name if m.department else None,
        "department_id":   m.department_id,
        "department_code": m.department.code if m.department else None,
        "association":     m.association.name,
        "association_id":  m.association_id,
        "is_trained":      m.is_trained,
        "training_date":   m.training_date.isoformat() if m.training_date else None,
        "is_active":       m.is_active,
        "disponibilite":   m.disponibilite_reelle,
        "capacite_max":    m.max_capacity,
        "est_sature":      m.disponibilite_reelle == 0,
        "nb_actifs":       getattr(m, 'nb_actifs', 0),
        "nb_termines":     getattr(m, 'nb_termines', 0),
        # Compte utilisateur lié
        "has_account":     m.user_id is not None,
        "user_id":         m.user_id,
        "user_email":      m.user.email if m.user_id else None,
    }


def _annotated_mentor_qs(pole_id=None, mentor_id=None):
    qs = (
        Mentor.objects
        .select_related('association', 'department', 'user')
        .annotate(
            nb_actifs=Count('mentorats', filter=Q(mentorats__status='ACTIVE')),
            nb_termines=Count('mentorats', filter=Q(mentorats__status__in=['CLOSED', 'ABORTED'])),
        )
    )
    if pole_id:
        qs = qs.filter(pole_id=pole_id, is_active=True)
    if mentor_id:
        qs = qs.filter(id=mentor_id)
    return qs


class PoleMentorsView(APIView):
    """
    GET  /pole/mentors/  – liste enrichie des mentors du pôle
    POST /pole/mentors/  – créer un mentor (scoped au pôle de l'animateur)

    Restriction par rôle :
    - AP  : peut créer un mentor uniquement pour sa propre association
    - ACP : peut créer un mentor pour n'importe quelle association du pôle

    Options compte utilisateur (mutuellement exclusives) :
    - create_account: true  → crée un User et le lie au mentor (retourne temp_password)
    - link_user_email: "x"  → lie le mentor à un User existant par email
    """
    permission_classes = [IsAuthenticated, IsAnimateur]

    def _pole_id(self, user):
        return user.animateur.pole_id if hasattr(user, 'animateur') else None

    def get(self, request):
        pole_id = self._pole_id(request.user)
        if not pole_id:
            return Response({"error": "Pas de pôle"}, status=400)

        mentors = _annotated_mentor_qs(pole_id=pole_id).order_by('association__name', 'last_name')
        return Response({"count": mentors.count(), "mentors": [_serialize_mentor(m) for m in mentors]})

    @transaction.atomic
    def post(self, request):
        pole_id = self._pole_id(request.user)
        if not pole_id:
            return Response({"error": "Pas de pôle"}, status=400)

        data = request.data
        required = ['first_name', 'last_name', 'email', 'association_id']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return Response(
                {"error": f"Champs requis : {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Association
        animateur = request.user.animateur
        try:
            association = Association.objects.get(id=data['association_id'], is_active=True)
        except Association.DoesNotExist:
            return Response({"error": "Association introuvable"}, status=400)

        # AP : uniquement sa propre association
        if not animateur.is_coordinator and association.id != animateur.association_id:
            return Response(
                {"error": "Vous ne pouvez créer des mentors que pour votre association."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Département optionnel
        department = None
        if data.get('department_id'):
            try:
                department = Department.objects.get(id=data['department_id'])
            except Department.DoesNotExist:
                return Response({"error": "Département introuvable"}, status=400)

        max_capacity = int(data.get('max_capacity') or 1)
        if max_capacity < 1:
            return Response({"error": "Capacité max ≥ 1"}, status=400)

        email = data['email'].strip().lower()
        if Mentor.objects.filter(email__iexact=email, pole_id=pole_id).exists():
            return Response({"error": "Un mentor avec cet email existe déjà dans ce pôle"}, status=400)

        # ── Compte utilisateur optionnel ──────────────────────────
        user = None
        temp_password = None

        if data.get('create_account'):
            # Créer un nouveau compte User lié au mentor
            if User.objects.filter(email__iexact=email).exists():
                return Response({"error": "Un compte utilisateur avec cet email existe déjà"}, status=400)
            temp_password = _generate_temp_password()
            user = User.objects.create_user(
                email=email,
                password=temp_password,
                first_name=data['first_name'].strip(),
                last_name=data['last_name'].strip(),
            )

        elif data.get('link_user_email'):
            # Lier à un compte existant
            link_email = data['link_user_email'].strip().lower()
            try:
                existing_user = User.objects.get(email__iexact=link_email)
                if hasattr(existing_user, 'mentor'):
                    return Response({"error": "Cet utilisateur est déjà lié à un profil mentor"}, status=400)
                user = existing_user
            except User.DoesNotExist:
                return Response({"error": f"Aucun compte trouvé pour l'email {link_email}"}, status=400)

        mentor = Mentor.objects.create(
            pole_id=pole_id,
            association=association,
            department=department,
            first_name=data['first_name'].strip(),
            last_name=data['last_name'].strip(),
            email=email,
            phone=data.get('phone', '').strip(),
            city=data.get('city', '').strip(),
            code_postal=data.get('code_postal', '').strip(),
            observations=data.get('observations', '').strip(),
            max_capacity=max_capacity,
            disponibilite_reelle=max_capacity,
            is_trained=bool(data.get('is_trained', False)),
            is_active=True,
            user=user,
        )

        result = _serialize_mentor(mentor)
        if temp_password:
            result['temp_password'] = temp_password
        return Response(result, status=status.HTTP_201_CREATED)


class PoleMentorDetailView(APIView):
    """
    GET   /pole/mentors/{id}/  – détail d'un mentor
    PATCH /pole/mentors/{id}/  – modifier un mentor (ACP : tous ; AP : seulement son association)

    Champ compte (PATCH) :
    - link_user_email: "email"  → lie à un User existant
    - link_user_email: ""       → délie le compte
    """
    permission_classes = [IsAuthenticated, IsAnimateur]

    def _get_mentor_and_pole(self, request, mentor_id):
        if not hasattr(request.user, 'animateur'):
            return None, None, Response({"error": "Pas de pôle"}, status=400)
        animateur = request.user.animateur
        pole_id = animateur.pole_id
        mentor = get_object_or_404(
            Mentor.objects.select_related('association', 'department', 'user'),
            id=mentor_id, pole_id=pole_id,
        )
        # AP : peut uniquement modifier les mentors de sa propre association
        if not animateur.is_coordinator and mentor.association_id != animateur.association_id:
            return None, None, Response(
                {"error": "Vous ne pouvez modifier que les mentors de votre association."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return mentor, pole_id, None

    def get(self, request, mentor_id):
        _, _, err = self._get_mentor_and_pole(request, mentor_id)
        if err:
            return err
        m = _annotated_mentor_qs(mentor_id=mentor_id).first()
        return Response(_serialize_mentor(m))

    @transaction.atomic
    def patch(self, request, mentor_id):
        mentor, _, err = self._get_mentor_and_pole(request, mentor_id)
        if err:
            return err

        data = request.data
        animateur = request.user.animateur
        is_ap = not animateur.is_coordinator

        if 'association_id' in data:
            if is_ap:
                # AP ne peut pas changer l'association d'un mentor
                return Response(
                    {"error": "Vous n'êtes pas autorisé à changer l'association d'un mentor."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            try:
                mentor.association = Association.objects.get(
                    id=data['association_id'], is_active=True
                )
            except Association.DoesNotExist:
                return Response({"error": "Association introuvable"}, status=400)

        if 'department_id' in data:
            if data['department_id']:
                try:
                    mentor.department = Department.objects.get(id=data['department_id'])
                except Department.DoesNotExist:
                    return Response({"error": "Département introuvable"}, status=400)
            else:
                mentor.department = None

        for field in ('first_name', 'last_name', 'email', 'phone', 'city', 'code_postal', 'observations'):
            if field in data:
                setattr(mentor, field, str(data[field]).strip())

        if 'max_capacity' in data:
            new_cap = int(data['max_capacity'])
            if new_cap < 1:
                return Response({"error": "Capacité max ≥ 1"}, status=400)
            diff = new_cap - mentor.max_capacity
            mentor.max_capacity = new_cap
            mentor.disponibilite_reelle = max(0, mentor.disponibilite_reelle + diff)

        if 'is_trained' in data:
            mentor.is_trained = bool(data['is_trained'])

        if 'is_active' in data:
            new_active = bool(data['is_active'])
            if mentor.is_active != new_active:
                mentor.is_active = new_active
                if not new_active:
                    mentor.disponibilite_reelle = 0
                else:
                    # Réactivation : recalcule depuis le vrai nombre de mentorats actifs
                    actifs = mentor.mentorats.filter(status='ACTIVE').count()
                    mentor.disponibilite_reelle = max(0, mentor.max_capacity - actifs)

        # ── Liaison compte utilisateur ─────────────────────────────
        if 'link_user_email' in data:
            link_email = data.get('link_user_email') or ''
            if link_email.strip():
                link_email = link_email.strip().lower()
                try:
                    target_user = User.objects.get(email__iexact=link_email)
                    # Vérifier que ce User n'est pas déjà lié à un autre mentor
                    if hasattr(target_user, 'mentor') and target_user.mentor.id != mentor.id:
                        return Response(
                            {"error": "Cet utilisateur est déjà lié à un autre profil mentor"},
                            status=400,
                        )
                    mentor.user = target_user
                except User.DoesNotExist:
                    return Response({"error": f"Aucun compte trouvé pour l'email {link_email}"}, status=400)
            else:
                # Délier le compte
                mentor.user = None

        mentor.save()
        m = _annotated_mentor_qs(mentor_id=mentor.id).first()
        return Response(_serialize_mentor(m))
