import secrets
from django.db import models


class AcceptanceMentorat(models.Model):
    STATUT_CHOICES = [
        ('PENDING', 'En attente'),
        ('ACCEPTE', 'Accepté'),
        ('REFUSE', 'Refusé'),
    ]

    mentorat = models.OneToOneField(
        'Mentorat',
        on_delete=models.CASCADE,
        related_name='acceptance',
    )
    token = models.CharField(max_length=64, unique=True)
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='PENDING')
    assigned_by = models.ForeignKey(
        'Animateur',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acceptances_initiees',
    )
    repondu_at = models.DateTimeField(null=True, blank=True)
    email_sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'acceptance_mentorats'

    def __str__(self):
        return f"Acceptance mentorat #{self.mentorat_id} — {self.statut}"

    @classmethod
    def create_for_mentorat(cls, mentorat, assigned_by=None):
        token = secrets.token_hex(32)
        return cls.objects.create(
            mentorat=mentorat,
            token=token,
            assigned_by=assigned_by,
        )
