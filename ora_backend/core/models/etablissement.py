# core/models/etablissement.py
from django.db import models


class Etablissement(models.Model):
    """
    Établissement de formation (CFA, lycée professionnel, école, entreprise…)
    Rattaché à un pôle ORA. Créé/géré par l'ACP pour standardiser les noms
    saisis librement par les jeunes dans leurs demandes.
    """
    nom         = models.CharField(max_length=200, verbose_name='Nom de l\'établissement')
    code_postal = models.CharField(max_length=10, verbose_name='Code postal')
    pole        = models.ForeignKey(
        'Pole',
        on_delete=models.CASCADE,
        related_name='etablissements',
        verbose_name='Pôle'
    )
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'etablissements'
        ordering = ['nom']
        verbose_name = 'Établissement'
        verbose_name_plural = 'Établissements'

    def __str__(self):
        return f"{self.nom} ({self.code_postal})"
