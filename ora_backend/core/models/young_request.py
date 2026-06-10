# core/models/young_request.py
from django.db import models


class YoungRequest(models.Model):
    STATUS_CHOICES = [
        ('NEW',       'Nouvelle'),
        ('PENDING',   'En attente de mentor'),
        ('ASSIGNED',  'Mentor assigné'),
        ('CLOSED',    'Clôturée'),
        ('CANCELLED', 'Annulée'),
    ]

    GENDER_CHOICES = [
        ('M', 'Garçon'),
        ('F', 'Fille'),
        ('O', 'Autre'),
    ]

    DIPLOME_CHOICES = [
        ('CAP',       'Niveau 3 — CAP'),
        ('BEP',       'Niveau 3 — BEP'),
        ('BAC_PRO',   'Niveau 4 — Bac Pro'),
        ('BAC_AUTRE', 'Niveau 4 — Bac autres'),
        ('BP',        'Niveau 4 — BP'),
        ('BTS',       'Niveau 5 — BTS'),
        ('DUT',       'Niveau 5 — DUT'),
        ('LIC_PRO',   'Niveau 6 — Licence Pro'),
        ('BUT',       'Niveau 6 — BUT'),
        ('MASTER',    'Niveau 7 — Master'),
        ('DEA',       'Niveau 7 — DEA'),
        ('DES',       "Niveau 7 — Diplôme d'études spécialisées"),
        ('ING',       'Niveau 7 — Ingénieur'),
    ]

    SITUATION_CHOICES = [
        ('apprentissage', 'Déjà en apprentissage'),
        ('recherche',     "En recherche d'apprentissage"),
    ]

    # ── Informations personnelles ────────────────────────────
    first_name = models.CharField(max_length=100)
    last_name  = models.CharField(max_length=100)
    email      = models.EmailField(blank=True)
    phone      = models.CharField(max_length=30, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    gender     = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)

    # ── Localisation ─────────────────────────────────────────
    city       = models.CharField(max_length=100, blank=True)  # conservé pour compatibilité
    commune    = models.CharField(max_length=200, blank=True, verbose_name='Commune')
    code_postal = models.CharField(max_length=10, blank=True, verbose_name='Code postal')
    latitude   = models.FloatField(null=True, blank=True, verbose_name='Latitude')
    longitude  = models.FloatField(null=True, blank=True, verbose_name='Longitude')
    department = models.ForeignKey(
        'Department',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name='Département'
    )

    # ── Parcours de formation ────────────────────────────────
    nom_etablissement = models.CharField(
        max_length=200, blank=True,
        verbose_name='Nom de l\'établissement',
        help_text='Nom saisi librement par le jeune lors de sa demande'
    )
    etablissement = models.ForeignKey(
        'Etablissement',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='young_requests',
        verbose_name='Établissement (validé par l\'ACP)'
    )
    diplome_prepare = models.CharField(
        max_length=20, choices=DIPLOME_CHOICES, blank=True,
        verbose_name='Diplôme préparé'
    )
    situation = models.CharField(
        max_length=20, choices=SITUATION_CHOICES, blank=True,
        verbose_name='Situation'
    )

    # ── Demande ──────────────────────────────────────────────
    request_date      = models.DateField(auto_now_add=True)
    status            = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW')
    needs_description = models.TextField(verbose_name='Description des besoins')

    # ── Attribution ──────────────────────────────────────────
    pole = models.ForeignKey(
        'Pole',
        on_delete=models.CASCADE,
        related_name='young_requests',
        null=True, blank=True
    )
    raison_transfert = models.TextField(
        blank=True, default='',
        verbose_name='Raison du transfert',
        help_text='Raison saisie par le pôle qui a transféré cette demande'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'young_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} — {self.get_status_display()}"
