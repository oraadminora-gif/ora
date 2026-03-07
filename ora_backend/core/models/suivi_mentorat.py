# core/models/suivi_mentorat.py
from django.db import models


class SuiviMentorat(models.Model):
    TYPE_CHOICES = [
        ('PRESENTIEL', 'Présentiel'),
        ('VISIO',      'Visioconférence'),
        ('TELEPHONE',  'Téléphone'),
        ('EMAIL',      'Email / Message'),
    ]

    mentorat = models.ForeignKey(
        'Mentorat',
        on_delete=models.CASCADE,
        related_name='suivis',
    )

    date_rencontre   = models.DateField(help_text="Date de la rencontre")
    duree_minutes    = models.PositiveIntegerField(default=60, help_text="Durée en minutes")
    type_rencontre   = models.CharField(max_length=20, choices=TYPE_CHOICES, default='PRESENTIEL')
    objectifs_atteints = models.BooleanField(default=False, help_text="Objectifs de la rencontre atteints ?")
    notes            = models.TextField(blank=True, help_text="Notes libres sur la rencontre")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'suivis_mentorat'
        ordering = ['-date_rencontre']

    def __str__(self):
        return f"Suivi {self.mentorat} – {self.date_rencontre} ({self.duree_minutes} min)"
