# core/models/evaluation_mentor.py
import secrets
from django.db import models


class EvaluationMentor(models.Model):
    """Évaluation du mentor par le jeune après clôture du mentorat."""

    mentorat = models.OneToOneField(
        'Mentorat',
        on_delete=models.CASCADE,
        related_name='evaluation',
    )
    token = models.CharField(
        max_length=64,
        unique=True,
        help_text="Token secret envoyé par email au jeune",
    )
    # Réponses du jeune (null tant que non soumises)
    rating_objectifs = models.IntegerField(
        null=True, blank=True,
        help_text="Tes objectifs personnels ont-ils été atteints ? (1-5)",
    )
    rating_accompagnement = models.IntegerField(
        null=True, blank=True,
        help_text="As-tu apprécié la qualité de l'accompagnement par le Mentor ? (1-5)",
    )
    rating_recommandation = models.IntegerField(
        null=True, blank=True,
        help_text="Recommanderais-tu ORA à un copain ? (1-5)",
    )
    comment = models.TextField(blank=True, help_text="Commentaire libre")
    submitted_at = models.DateTimeField(
        null=True, blank=True,
        help_text="Date de soumission par le jeune",
    )
    email_sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'evaluation_mentors'

    def __str__(self):
        return f"Évaluation mentorat #{self.mentorat_id} — note={self.rating}"

    @classmethod
    def create_for_mentorat(cls, mentorat):
        """Crée un token d'évaluation (ne s'envoie pas ici)."""
        token = secrets.token_hex(32)
        return cls.objects.create(mentorat=mentorat, token=token)
