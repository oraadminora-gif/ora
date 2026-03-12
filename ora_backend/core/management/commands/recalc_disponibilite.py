# core/management/commands/recalc_disponibilite.py
"""
Recalcule disponibilite_reelle pour tous les mentors (ou un mentor précis)
depuis le vrai compte de mentorats ACTIFS en base.

Usage :
    python manage.py recalc_disponibilite           # tous les mentors
    python manage.py recalc_disponibilite --id 16   # mentor ID 16 uniquement
    python manage.py recalc_disponibilite --dry-run # affiche sans modifier
"""
from django.core.management.base import BaseCommand
from core.models import Mentor


class Command(BaseCommand):
    help = "Recalcule disponibilite_reelle des mentors depuis le vrai nombre de mentorats actifs."

    def add_arguments(self, parser):
        parser.add_argument('--id',      type=int, help="ID du mentor à corriger")
        parser.add_argument('--dry-run', action='store_true', help="Affiche sans modifier")

    def handle(self, *args, **options):
        qs = Mentor.objects.prefetch_related('mentorats')
        if options['id']:
            qs = qs.filter(pk=options['id'])

        corrections = 0
        for mentor in qs:
            actifs = mentor.mentorats.filter(status='ACTIVE').count()
            correct = max(0, mentor.max_capacity - actifs)
            if mentor.disponibilite_reelle != correct:
                self.stdout.write(
                    f"  [{mentor.id}] {mentor.first_name} {mentor.last_name} : "
                    f"dispo {mentor.disponibilite_reelle} -> {correct} "
                    f"(max={mentor.max_capacity}, actifs={actifs})"
                )
                if not options['dry_run']:
                    mentor.disponibilite_reelle = correct
                    mentor.save(update_fields=['disponibilite_reelle'])
                corrections += 1

        if corrections == 0:
            self.stdout.write(self.style.SUCCESS("Tout est cohérent, aucune correction nécessaire."))
        elif options['dry_run']:
            self.stdout.write(self.style.WARNING(f"{corrections} incohérence(s) détectée(s) (dry-run, rien modifié)."))
        else:
            self.stdout.write(self.style.SUCCESS(f"{corrections} mentor(s) corrigé(s)."))
