# core/models/candidature_mentor.py
from django.db import models


class CandidatureMentor(models.Model):
    """
    Candidature publique pour devenir mentor.
    Créée par le formulaire public, validée par ACP ou AP de la même association.
    Sur validation, une entrée Mentor est créée à partir de cette candidature.
    """

    STATUT_CHOICES = [
        ('PENDING',   'En attente'),
        ('VALIDATED', 'Validée'),
        ('REJECTED',  'Rejetée'),
    ]

    # ── Localisation & orientation ───────────────────────────
    code_postal = models.CharField(max_length=10, verbose_name='Code postal')
    commune     = models.CharField(max_length=200, blank=True, verbose_name='Commune')
    pole        = models.ForeignKey(
        'Pole',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='candidatures_mentors',
        verbose_name='Pôle détecté',
    )
    association = models.ForeignKey(
        'Association',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='candidatures_mentors',
        verbose_name='Association choisie',
    )

    # ── Informations personnelles ────────────────────────────
    first_name = models.CharField(max_length=100, verbose_name='Prénom')
    last_name  = models.CharField(max_length=100, verbose_name='Nom')
    email      = models.EmailField(verbose_name='Email')
    phone      = models.CharField(max_length=30, blank=True, verbose_name='Téléphone')

    # ── Profil mentor ────────────────────────────────────────
    experience_pro  = models.TextField(verbose_name='Expérience professionnelle')
    domaines        = models.JSONField(default=list, verbose_name='Domaines d\'expertise')
    disponibilite   = models.CharField(max_length=50, blank=True, verbose_name='Disponibilité')
    motivation      = models.TextField(blank=True, verbose_name='Motivation')

    # ── Workflow ─────────────────────────────────────────────
    statut          = models.CharField(max_length=20, choices=STATUT_CHOICES, default='PENDING')
    notes_rejet     = models.TextField(blank=True, verbose_name='Motif de rejet')
    validated_by    = models.ForeignKey(
        'Animateur',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='candidatures_validees',
        verbose_name='Validé par',
    )
    validated_at    = models.DateTimeField(null=True, blank=True)
    mentor_created  = models.ForeignKey(
        'Mentor',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='candidature_source',
        verbose_name='Mentor créé',
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'candidatures_mentors'
        ordering = ['-created_at']
        verbose_name = 'Candidature Mentor'
        verbose_name_plural = 'Candidatures Mentors'

    def __str__(self):
        return f"{self.first_name} {self.last_name} — {self.get_statut_display()} ({self.created_at.date()})"
