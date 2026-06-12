#core/models/mentorat.py
from django.db import models
from django.utils import timezone


CLOSURE_REASON_CHOICES = [
    ('NO_CONTACT',        'Aucun vrai contact établi'),
    ('LOST_CONTACT',      'Perte définitive du contact'),
    ('DIPLOMA_FAIL',      'Échec diplôme'),
    ('MENTEE_STOP',       'Arrêt souhaité par le mentoré'),
    ('OBJECTIVE_REACHED', 'Objectif atteint'),
]

CLOSURE_REASON_SCORE = {
    'NO_CONTACT':        0,
    'LOST_CONTACT':     -1,
    'DIPLOMA_FAIL':     -1,
    'MENTEE_STOP':       1,
    'OBJECTIVE_REACHED': 1,
}

PROBLEMATIQUES_CHOICES = [
    ('AIDE_INFO',       'Aide informatique'),
    ('FLE',             'Apprentissage du Français (FLE)'),
    ('CHANGER_EMP',     "Changer d'Employeur"),
    ('HANDICAP',        'Handicap'),
    ('LOGEMENT',        'Logement'),
    ('ORIENTATION',     'Orientation'),
    ('PB_ADMIN',        'Pb Administratifs'),
    ('PB_FINANCES',     'Pb Financiers – Gérer Budget'),
    ('PB_PSYCHO',       'Pb Psychologiques'),
    ('PREP_DOSSIER',    'Prép. Dossier Professionnel'),
    ('REL_EMPLOYEUR',   'Relations avec Employeur'),
    ('RECH_CONTRAT',    'Recherche Contrat Apprentissage'),
    ('SALAIRE',         'Salaire / respect des conventions'),
    ('SOUTIEN_MORAL',   'Soutien Moral'),
    ('SOUTIEN_SCOL',    'Soutien Scolaire'),
    ('ADDICTIONS',      'Addictions'),
]


class Mentorat(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'En attente'),
        ('ACTIVE', 'Actif'),
        ('CLOSED', 'Clôturé'),
        ('ABORTED', 'Abandonné'),
    ]
    
    # Relations principales
    mentor = models.ForeignKey(
        'Mentor',
        on_delete=models.CASCADE,
        related_name='mentorats'
    )
    young_request = models.OneToOneField(
        'YoungRequest',
        on_delete=models.CASCADE,
        related_name='mentorat'
    )
    pole = models.ForeignKey(
        'Pole',
        on_delete=models.CASCADE,
        related_name='mentorats'
    )
    
    # AP responsable du suivi (essentiel !)
    ap_responsable = models.ForeignKey(
        'Animateur',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mentorats_suivis',
        help_text="Animateur chargé du suivi (AP ou ACP)"
    )
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    assigned_at = models.DateField(null=True, blank=True, help_text="Date effective de début")
    expected_end_date = models.DateField(null=True, blank=True)
    closed_at = models.DateField(null=True, blank=True)
    
    # Statut
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    closure_reason = models.TextField(blank=True)
    message_cloture = models.TextField(blank=True, help_text="Message envoyé au jeune lors de la clôture")
    
    # Raison de clôture structurée
    closure_reason_code = models.CharField(
        max_length=20, blank=True, choices=CLOSURE_REASON_CHOICES,
        verbose_name='Raison de clôture',
    )

    # Suivi
    alerte_rouge = models.BooleanField(default=False, help_text="Problème signalé")
    dernier_contact = models.DateField(null=True, blank=True)
    nb_rencontres = models.PositiveIntegerField(default=0, verbose_name='Nombre de rencontres')
    nb_heures = models.DecimalField(
        max_digits=6, decimal_places=1, default=0,
        verbose_name="Nombre d'heures de suivi",
    )
    objectif_mentor = models.TextField(blank=True, verbose_name='Objectif du mentor')
    notes_suivi = models.TextField(
        blank=True, verbose_name='Bilan sommaire du suivi',
        help_text="Bilan de l'AP sur le déroulement du mentorat",
    )
    problematiques = models.JSONField(
        default=list, blank=True,
        help_text="Liste de codes parmi les problématiques prédéfinies"
    )

    # Type de modalité
    TYPE_MENTORAT_CHOICES = [
        ('presentiel',  'Présentiel'),
        ('distanciel',  'Distanciel'),
    ]
    type_mentorat = models.CharField(
        max_length=12, blank=True, choices=TYPE_MENTORAT_CHOICES,
        verbose_name='Type de mentorat',
        help_text="Modalité principale constatée : présentiel ou distanciel",
    )

    # Demande de clôture par le mentor (en attente de confirmation AP)
    cloture_en_attente = models.BooleanField(
        default=False,
        help_text="Mentor a demandé la clôture, en attente de confirmation AP"
    )
    cloture_action_demandee = models.CharField(
        max_length=10, blank=True,
        help_text="Action demandée : CLOSED ou ABORTED"
    )
    cloture_reason_demandee = models.TextField(
        blank=True, help_text="Raison soumise par le mentor"
    )
    cloture_message_demandee = models.TextField(
        blank=True, help_text="Message pour le jeune soumis par le mentor"
    )
    
    class Meta:
        db_table = 'mentorats'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.mentor} ↔ {self.young_request} [{self.status}]"
    
    def get_duree_mois(self):
        """Calcule la durée en mois"""
        if not self.assigned_at:
            return 0
        from dateutil.relativedelta import relativedelta
        end_date = self.closed_at or timezone.now().date()
        delta = relativedelta(end_date, self.assigned_at)
        return delta.years * 12 + delta.months
    
    def activer(self):
        """Active le mentorat PENDING → ACTIVE et décrémente la disponibilité du mentor."""
        if self.status == 'ACTIVE':
            return
        was_inactive = self.status in ('CLOSED', 'ABORTED')
        self.status = 'ACTIVE'
        self.assigned_at = self.assigned_at or timezone.now().date()
        self.save()
        # Seulement si on passe depuis un état inactif (PENDING n'a pas encore occupé de slot)
        if not was_inactive:
            mentor = self.mentor
            mentor.disponibilite_reelle = max(0, mentor.disponibilite_reelle - 1)
            mentor.save(update_fields=['disponibilite_reelle'])

    def cloturer(self, reason="", statut='CLOSED'):
        if self.status in ('CLOSED', 'ABORTED'):
            return
        was_active = self.status == 'ACTIVE'
        self.status = statut
        self.closure_reason = reason
        self.closed_at = timezone.now().date()
        self.save()

        # Libère une place uniquement si le mentorat était ACTIVE
        if was_active:
            mentor = self.mentor
            mentor.disponibilite_reelle = min(
                mentor.disponibilite_reelle + 1, mentor.max_capacity
            )
            mentor.save(update_fields=['disponibilite_reelle'])

        # Mise à jour demande
        self.young_request.status = 'CLOSED'
        self.young_request.save()