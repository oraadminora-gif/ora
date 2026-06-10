import threading

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from core.models import YoungRequest, Pole, Etablissement, Department
from core.services.geocoding import geocode_commune
from api.permissions import IsACP, IsCN, IsAnimateur


def _geocode_and_save(young_request_id: int, commune: str, code_postal: str):
    """Géocode en arrière-plan et met à jour la demande."""
    coords = geocode_commune(commune, code_postal)
    if coords:
        YoungRequest.objects.filter(id=young_request_id).update(
            latitude=coords[0],
            longitude=coords[1],
        )


class PendingRequestsView(APIView):
    """Demandes en attente de mentor dans le pôle."""
    permission_classes = [IsAuthenticated, IsAnimateur]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'animateur'):
            return Response({"error": "Pas de pôle"}, status=400)

        pole_id = user.animateur.pole_id
        demandes = YoungRequest.objects.filter(
            pole_id=pole_id, status__in=['NEW', 'PENDING']
        ).select_related('etablissement').order_by('-created_at')

        data = [self._serialize(d) for d in demandes]
        return Response({"count": len(data), "demandes": data})

    def _serialize(self, d):
        return {
            "id":              d.id,
            "jeune":           f"{d.first_name} {d.last_name}",
            "first_name":      d.first_name,
            "last_name":       d.last_name,
            "email":           d.email,
            "phone":           d.phone,
            "birth_date":      str(d.birth_date) if d.birth_date else '',
            "age":             self._age(d.birth_date) if d.birth_date else None,
            "gender":          d.gender,
            "gender_label":    {'M': 'Garçon', 'F': 'Fille', 'O': 'Autre'}.get(d.gender, ''),
            "commune":         d.commune if hasattr(d, 'commune') else d.city,
            "code_postal":     d.code_postal if hasattr(d, 'code_postal') else '',
            "ville":           d.city,
            "nom_etablissement": d.etablissement.nom if d.etablissement_id else d.nom_etablissement,
            "diplome_prepare": d.diplome_prepare,
            "diplome_label":   d.get_diplome_prepare_display() if d.diplome_prepare else '',
            "situation":       d.situation,
            "situation_label": d.get_situation_display() if d.situation else '',
            "date_demande":    d.created_at,
            "besoins":         d.needs_description,
            "raison_transfert": d.raison_transfert or '',
        }

    @staticmethod
    def _age(birth_date):
        from datetime import date
        today = date.today()
        return today.year - birth_date.year - (
            (today.month, today.day) < (birth_date.month, birth_date.day)
        )


class RerouterDemandeView(APIView):
    """
    AP/ACP : Renvoyer une demande vers un autre pôle.
    POST /api/pole/requests/{pk}/rerouter/
    Body : { "pole_id": int }
    """
    permission_classes = [IsAuthenticated, IsAnimateur]

    def post(self, request, pk):
        user = request.user
        if not hasattr(user, 'animateur'):
            return Response({"error": "Accès refusé"}, status=403)

        try:
            demande = YoungRequest.objects.get(pk=pk, pole=user.animateur.pole)
        except YoungRequest.DoesNotExist:
            return Response({"error": "Demande introuvable dans votre pôle"}, status=404)

        if demande.status not in ('NEW', 'PENDING'):
            return Response({"error": "Seules les demandes NEW ou PENDING peuvent être transférées"}, status=400)

        new_pole_id = request.data.get('pole_id')
        if not new_pole_id:
            return Response({"error": "pole_id requis"}, status=400)

        if int(new_pole_id) == user.animateur.pole_id:
            return Response({"error": "Le pôle de destination doit être différent"}, status=400)

        try:
            new_pole = Pole.objects.get(pk=new_pole_id, status='ACTIVE')
        except Pole.DoesNotExist:
            return Response({"error": "Pôle introuvable ou inactif"}, status=404)

        demande.pole             = new_pole
        demande.status           = 'NEW'
        demande.raison_transfert = (request.data.get('raison') or '').strip()
        demande.save()

        return Response({
            "success": True,
            "message": f"Demande transférée vers le pôle {new_pole.name}",
            "nouveau_pole": {"id": new_pole.id, "name": new_pole.name, "code": new_pole.code},
        })


class SetEtablissementDemandeView(APIView):
    """
    AP/ACP : Modifier l'établissement d'une demande.
    PATCH /api/pole/requests/{pk}/etablissement/
    Body (un parmi) :
      { "etablissement_id": int }          → établissement validé du pôle
      { "nom_manuel": "Nom libre" }         → saisie manuelle sans créer d'entité
    """
    permission_classes = [IsAuthenticated, IsAnimateur]

    def patch(self, request, pk):
        user = request.user
        if not hasattr(user, 'animateur'):
            return Response({"error": "Accès refusé"}, status=403)

        try:
            demande = YoungRequest.objects.get(pk=pk, pole=user.animateur.pole)
        except YoungRequest.DoesNotExist:
            return Response({"error": "Demande introuvable dans votre pôle"}, status=404)

        etab_id   = request.data.get('etablissement_id')
        nom_manuel = request.data.get('nom_manuel', '').strip()

        if etab_id:
            try:
                etab = Etablissement.objects.get(pk=etab_id, pole=user.animateur.pole)
            except Etablissement.DoesNotExist:
                return Response({"error": "Établissement introuvable dans votre pôle"}, status=404)
            demande.etablissement     = etab
            demande.nom_etablissement = etab.nom
        elif nom_manuel:
            demande.etablissement     = None
            demande.nom_etablissement = nom_manuel
        else:
            return Response({"error": "etablissement_id ou nom_manuel requis"}, status=400)

        demande.save()
        return Response({
            "success":          True,
            "nom_etablissement": demande.nom_etablissement,
            "etablissement_id":  demande.etablissement_id,
        })


class CreateDemandeView(APIView):
    """
    ACP ou AP : Créer une demande manuellement.
    POST /api/pole/requests/
    """
    permission_classes = [IsAuthenticated, IsAnimateur]

    def post(self, request):
        user = request.user
        animateur = getattr(user, 'animateur', None)
        if not animateur or not animateur.pole:
            return Response({"error": "Pas de pôle assigné"}, status=400)

        pole = animateur.pole
        data = request.data

        # ── Champs requis ─────────────────────────────────────
        first_name        = (data.get('first_name') or '').strip()
        last_name         = (data.get('last_name') or '').strip()
        needs_description = (data.get('needs_description') or '').strip()

        if not first_name or not last_name or not needs_description:
            return Response(
                {"error": "Champs requis : first_name, last_name, needs_description"},
                status=400,
            )

        # ── Localisation ──────────────────────────────────────
        commune     = (data.get('commune') or '').strip()
        code_postal = (data.get('code_postal') or '').strip()

        # ── Création ──────────────────────────────────────────
        demande = YoungRequest.objects.create(
            first_name        = first_name,
            last_name         = last_name,
            email             = (data.get('email') or '').strip(),
            phone             = (data.get('phone') or '').strip(),
            birth_date        = data.get('birth_date') or None,
            gender            = (data.get('gender') or '').strip(),
            commune           = commune,
            code_postal       = code_postal,
            city              = commune,  # city = commune pour compatibilité
            nom_etablissement = (data.get('nom_etablissement') or '').strip(),
            diplome_prepare   = (data.get('diplome_prepare') or '').strip(),
            situation         = (data.get('situation') or '').strip(),
            needs_description = needs_description,
            pole              = pole,
            status            = 'NEW',
        )

        # ── Géocodage asynchrone ──────────────────────────────
        if commune or code_postal:
            t = threading.Thread(
                target=_geocode_and_save,
                args=(demande.id, commune, code_postal),
                daemon=True,
            )
            t.start()

        return Response({
            "success": True,
            "id":      demande.id,
            "jeune":   f"{demande.first_name} {demande.last_name}",
        }, status=status.HTTP_201_CREATED)
