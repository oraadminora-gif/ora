# core/models/audit_log.py
from django.db import models


class AuditLog(models.Model):
    """
    Journal d'audit centralisé : qui a fait quoi, sur quel objet, quand,
    depuis quelle IP, avec les valeurs avant/après champ par champ.
    Alimenté automatiquement par les signaux (core/audit.py) sur les
    modèles métier — jamais modifié à la main.
    """

    ACTION_CHOICES = [
        ('CREATE', 'Création'),
        ('UPDATE', 'Modification'),
        ('DELETE', 'Suppression'),
        ('LOGIN',  'Connexion'),
    ]

    user = models.ForeignKey(
        'User', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='audit_logs',
    )
    user_repr = models.CharField(
        max_length=255, blank=True,
        help_text="Nom/email de l'utilisateur au moment de l'action (conservé même si le compte est supprimé)",
    )
    pole = models.ForeignKey(
        'Pole', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='audit_logs',
    )
    pole_name = models.CharField(
        max_length=100, blank=True,
        help_text="Code/nom du pôle au moment de l'action (conservé même si le pôle change ou est supprimé)",
    )
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50, blank=True)
    object_repr = models.CharField(max_length=255, blank=True)
    changes = models.JSONField(default=dict, blank=True, help_text="{champ: [avant, après]}")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.created_at:%d/%m/%Y %H:%M} — {self.user_repr or 'Anonyme'} — {self.get_action_display()} {self.model_name} #{self.object_id}"
