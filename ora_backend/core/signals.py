# core/signals.py
"""
Signaux Django pour maintenir disponibilite_reelle en cohérence automatique.
Ce signal recalcule la disponibilité depuis le vrai compte de mentorats ACTIFS,
couvrant les cas d'administration directe (admin Django, scripts, imports).
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


def _sync_mentor_disponibilite(mentor_id: int) -> None:
    """Recalcule disponibilite_reelle depuis le vrai compte de mentorats ACTIVE."""
    from core.models import Mentor
    try:
        mentor = Mentor.objects.get(pk=mentor_id)
        actifs = mentor.mentorats.filter(status='ACTIVE').count()
        correct = max(0, mentor.max_capacity - actifs)
        if mentor.disponibilite_reelle != correct:
            mentor.disponibilite_reelle = correct
            mentor.save(update_fields=['disponibilite_reelle'])
    except Mentor.DoesNotExist:
        pass


@receiver(post_save, sender='core.Mentorat')
def on_mentorat_saved(sender, instance, **kwargs):
    """Après chaque sauvegarde d'un Mentorat, recalcule la dispo du mentor concerné."""
    _sync_mentor_disponibilite(instance.mentor_id)


@receiver(post_delete, sender='core.Mentorat')
def on_mentorat_deleted(sender, instance, **kwargs):
    """Après suppression d'un Mentorat, recalcule la dispo du mentor concerné."""
    _sync_mentor_disponibilite(instance.mentor_id)
