# core/models/animateur.py
from django.db import models


class Animateur(models.Model):
    """
    Animateur de Pôle (AP ou ACP)
    """
    user = models.OneToOneField(
        'User',
        on_delete=models.CASCADE,
        related_name='animateur'
    )
    
    pole = models.ForeignKey(
        'Pole',
        on_delete=models.CASCADE,
        related_name='animateurs'
    )
    
    association = models.ForeignKey(
        'Association',
        on_delete=models.CASCADE,
        related_name='animateurs'
    )
    
    # Infos personnelles
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    city = models.CharField(max_length=100, blank=True)
    
    # Rôles (non exclusifs — un animateur peut être AP, ACP, ou les deux)
    is_acp = models.BooleanField(
        default=False,
        help_text="Animateur Coordinateur de Pôle"
    )
    is_ap = models.BooleanField(
        default=False,
        help_text="Animateur de Pôle"
    )
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'animateurs'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        if self.is_acp and self.is_ap:
            role = "ACP/AP"
        elif self.is_acp:
            role = "ACP"
        elif self.is_ap:
            role = "AP"
        else:
            role = "N/A"
        return f"{role} - {self.first_name} {self.last_name} ({self.pole.code})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"