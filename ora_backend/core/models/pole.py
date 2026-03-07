# core/models/pole.py
from django.db import models


class Pole(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE',   'Actif'),
        ('INACTIVE', 'Inactif'),
    ]

    ETAT_ACTIVITE_CHOICES = [
        ('a_letude',    "A l'etude"),
        ('demarre',     'Demarre'),
        ('fragile',     'Fragile'),
        ('experimente', 'Experimente'),
        ('arrete',      'Arrete'),
    ]

    code          = models.CharField(max_length=10, unique=True)
    name          = models.CharField(max_length=100)
    villes        = models.JSONField(default=list, blank=True,
                                     help_text='Liste de villes (max 5)')
    etat_activite = models.CharField(
        max_length=15, choices=ETAT_ACTIVITE_CHOICES,
        blank=True, default='',
        verbose_name="Etat d'activite"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')

    # Contact
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)

    # Couverture géographique — un pôle peut couvrir plusieurs départements
    departments = models.ManyToManyField(
        'Department',
        related_name='poles',
        blank=True,
        verbose_name='Départements couverts'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'poles'
        ordering = ['code']

    def __str__(self):
        return f"{self.code} — {self.name}"
