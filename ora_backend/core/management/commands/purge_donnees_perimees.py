# core/management/commands/purge_donnees_perimees.py
"""
Anonymise les demandes de jeunes (YoungRequest) dont la donnée personnelle n'a
plus de raison d'être conservée, conformément au principe de limitation de la
conservation du RGPD (article 5.1.e).

Ne supprime jamais l'enregistrement : l'anonymise (vide les champs identifiants,
garde les champs agrégés/catégoriels nécessaires aux indicateurs de pilotage et
aux bilans pluriannuels). Un Mentorat étant lié en OneToOne CASCADE à sa
YoungRequest, une suppression aurait détruit l'historique de mentorat associé.

Deux règles de conservation, ajustables en ligne de commande :

1. Demande ayant donné lieu à un mentorat CLOSED ou ABORTED depuis plus de
   `--mentorat-annees` ans (par défaut 3 ans, cohérent avec l'horizon de la
   convention pluriannuelle DJEPVA 2025-2027).
2. Demande jamais transformée en mentorat (NEW, PENDING, CANCELLED) datant de
   plus de `--sans-mentorat-annees` ans (par défaut 1 an).

Les mentorats ACTIVE ou PENDING ne sont jamais concernés.

Usage :
    python manage.py purge_donnees_perimees                # aperçu (dry-run par défaut)
    python manage.py purge_donnees_perimees --apply         # applique réellement
    python manage.py purge_donnees_perimees --mentorat-annees 2 --sans-mentorat-annees 1 --apply
"""
from datetime import date

from dateutil.relativedelta import relativedelta
from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import YoungRequest

# Statuts n'ayant jamais débouché sur un mentorat suivi
STATUTS_SANS_MENTORAT = ['NEW', 'PENDING', 'CANCELLED']


class Command(BaseCommand):
    help = "Anonymise les demandes de jeunes dont la donnée personnelle est périmée (RGPD)."

    def add_arguments(self, parser):
        parser.add_argument(
            '--mentorat-annees', type=int, default=3,
            help="Ancienneté (en années depuis la clôture du mentorat) au-delà de laquelle anonymiser (défaut: 3)."
        )
        parser.add_argument(
            '--sans-mentorat-annees', type=int, default=1,
            help="Ancienneté (en années depuis la demande) au-delà de laquelle anonymiser une demande jamais convertie (défaut: 1)."
        )
        parser.add_argument(
            '--apply', action='store_true',
            help="Applique réellement l'anonymisation. Sans cette option : aperçu seul, rien n'est modifié."
        )

    def handle(self, *args, **options):
        today = date.today()
        seuil_mentorat = today - relativedelta(years=options['mentorat_annees'])
        seuil_sans_mentorat = today - relativedelta(years=options['sans_mentorat_annees'])
        appliquer = options['apply']

        # ── Groupe 1 : mentorat clôturé/abandonné depuis plus de N ans ──────
        qs_avec_mentorat = YoungRequest.objects.filter(
            mentorat__status__in=['CLOSED', 'ABORTED'],
            mentorat__closed_at__lt=seuil_mentorat,
        ).exclude(first_name='Anonymisé')

        # ── Groupe 2 : jamais convertie en mentorat, demande ancienne ───────
        qs_sans_mentorat = YoungRequest.objects.filter(
            status__in=STATUTS_SANS_MENTORAT,
            request_date__lt=seuil_sans_mentorat,
        ).exclude(first_name='Anonymisé')

        cibles = list(qs_avec_mentorat) + [
            yr for yr in qs_sans_mentorat if yr not in qs_avec_mentorat
        ]

        if not cibles:
            self.stdout.write(self.style.SUCCESS("Aucune donnée périmée à anonymiser."))
            return

        self.stdout.write(
            f"{len(cibles)} demande(s) identifiée(s) "
            f"(mentorat clos avant {seuil_mentorat}, ou sans mentorat avant {seuil_sans_mentorat}) :"
        )
        for yr in cibles:
            self.stdout.write(f"  [{yr.id}] {yr.first_name} {yr.last_name} — statut {yr.status}")

        if not appliquer:
            self.stdout.write(self.style.WARNING(
                "Aperçu uniquement (dry-run) — relancer avec --apply pour anonymiser réellement."
            ))
            return

        with transaction.atomic():
            for yr in cibles:
                self._anonymiser(yr)

        self.stdout.write(self.style.SUCCESS(f"{len(cibles)} demande(s) anonymisée(s)."))

    @staticmethod
    def _anonymiser(yr: YoungRequest):
        """Vide les champs identifiants, conserve les champs agrégés utiles au reporting."""
        yr.first_name = 'Anonymisé'
        yr.last_name = f'#{yr.id}'
        yr.email = ''
        yr.phone = ''
        yr.birth_date = None
        yr.city = ''
        yr.commune = ''
        yr.code_postal = ''
        yr.latitude = None
        yr.longitude = None
        yr.nom_etablissement = ''
        yr.needs_description = ''
        yr.raison_transfert = ''
        # Conservés : gender, diplome_prepare, situation, date_previsionnelle,
        # department, etablissement (FK), pole, status, request_date — nécessaires
        # aux indicateurs agrégés et bilans, sans être identifiants en eux-mêmes.
        yr.save()
