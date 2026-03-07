#core/models/mentorat.py
from django.db import models
from django.utils import timezone


class Mentorat(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'En attente'),  # Créé mais pas encore actif
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
        limit_choices_to={'is_coordinator': False},  # Seuls les AP, pas les ACP
        help_text="AP chargé du suivi de ce mentorat"
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
    
    # Suivi
    alerte_rouge = models.BooleanField(default=False, help_text="Problème signalé")
    dernier_contact = models.DateField(null=True, blank=True)
    notes_suivi = models.TextField(blank=True, help_text="Notes de l'AP")
    problematiques = models.JSONField(
        default=list, blank=True,
        help_text="Liste de codes (max 3) parmi les problématiques prédéfinies"
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
        """Active le mentorat"""
        self.status = 'ACTIVE'
        self.assigned_at = timezone.now().date()
        self.save()
    
    def cloturer(self, reason="", statut='CLOSED'):
        if self.status == 'CLOSED':
            return
        
        self.status = statut
        self.closure_reason = reason
        self.closed_at = timezone.now().date()
        self.save()

        # Libération mentor (propre)
        mentor = self.mentor
        mentor.disponibilite_reelle += 1
        mentor.save()

        # Mise à jour demande
        self.young_request.status = 'CLOSED'
        self.young_request.save()