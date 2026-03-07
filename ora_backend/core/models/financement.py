# core/models/financement.py
from django.db import models


class Financement(models.Model):
    """
    Financeur d'un mentorat (OPCO, collectivité, fondation…).
    Entité de référence partagée entre les mentorats.
    """
    TYPE_CHOICES = [
        ('local',    'Local'),
        ('national', 'National'),
    ]

    nom  = models.CharField(max_length=200, verbose_name='Nom du financeur')
    code = models.CharField(max_length=50, unique=True, verbose_name='Code')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, verbose_name='Type')

    class Meta:
        db_table = 'financements'
        ordering = ['nom']
        verbose_name = 'Financement'
        verbose_name_plural = 'Financements'

    def __str__(self):
        return f"{self.code} — {self.nom}"


class MentoratFinancement(models.Model):
    """
    Association entre un mentorat et un ou plusieurs financeurs.
    Stocke aussi le code spécifique du dossier/contrat pour ce mentorat.
    """
    mentorat        = models.ForeignKey(
        'Mentorat',
        on_delete=models.CASCADE,
        related_name='financements'
    )
    financement     = models.ForeignKey(
        'Financement',
        on_delete=models.CASCADE,
        related_name='mentorat_financements'
    )
    code_specifique = models.CharField(
        max_length=100, blank=True,
        verbose_name='Code dossier/contrat',
        help_text='Référence interne du financement pour ce mentorat'
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mentorat_financements'
        unique_together = [['mentorat', 'financement']]
        verbose_name = 'Financement de mentorat'
        verbose_name_plural = 'Financements de mentorats'

    def __str__(self):
        return f"{self.mentorat_id} ← {self.financement.code}"
