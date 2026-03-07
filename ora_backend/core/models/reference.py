# core/models/reference.py
from django.db import models


class Department(models.Model):
    """Département français (métropolitain + DOM)."""
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'departments'
        ordering = ['code']

    def __str__(self):
        return f"{self.code} — {self.name}"


class Association(models.Model):
    """
    Association membre d'ORA (AGIR, ECTI, EGEE, OTECI).
    Entité nationale — aucune relation directe avec un pôle.
    La relation association ↔ pôle passe par les personnes
    (Animateur, Mentor) qui appartiennent à une association ET à un pôle.
    """
    code      = models.CharField(max_length=20, unique=True)
    name      = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'associations'
        ordering = ['code']

    def __str__(self):
        return f"{self.code} — {self.name}"
