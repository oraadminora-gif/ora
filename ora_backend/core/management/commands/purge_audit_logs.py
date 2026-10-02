# core/management/commands/purge_audit_logs.py
"""
Supprime les entrées du journal d'audit (AuditLog) plus anciennes que N mois.

Usage :
    python manage.py purge_audit_logs                # aperçu (dry-run par défaut)
    python manage.py purge_audit_logs --apply
    python manage.py purge_audit_logs --mois 6 --apply
"""
from dateutil.relativedelta import relativedelta
from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import AuditLog


class Command(BaseCommand):
    help = "Supprime les entrées du journal d'audit plus anciennes que N mois (défaut 3)."

    def add_arguments(self, parser):
        parser.add_argument(
            '--mois', type=int, default=3,
            help="Ancienneté (en mois) au-delà de laquelle purger (défaut: 3)."
        )
        parser.add_argument(
            '--apply', action='store_true',
            help="Applique réellement la purge. Sans cette option : aperçu seul, rien n'est supprimé."
        )

    def handle(self, *args, **options):
        seuil = timezone.now() - relativedelta(months=options['mois'])
        qs = AuditLog.objects.filter(created_at__lt=seuil)
        count = qs.count()

        if not count:
            self.stdout.write(self.style.SUCCESS("Aucune entrée à purger."))
            return

        self.stdout.write(f"{count} entrée(s) du journal d'audit antérieure(s) à {seuil:%d/%m/%Y} identifiée(s).")

        if not options['apply']:
            self.stdout.write(self.style.WARNING(
                "Aperçu uniquement (dry-run) — relancer avec --apply pour purger réellement."
            ))
            return

        qs.delete()
        self.stdout.write(self.style.SUCCESS(f"{count} entrée(s) supprimée(s)."))
