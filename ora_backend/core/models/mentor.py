#core/models/mentor.py
from django.db import models


class Mentor(models.Model):
    user = models.OneToOneField(
        'User',
        on_delete=models.CASCADE,
        related_name='mentor',
        null=True,
        blank=True
    )

    pole = models.ForeignKey(
        'Pole',
        on_delete=models.CASCADE,
        related_name='mentors'
    )

    association = models.ForeignKey(
        'Association',
        on_delete=models.CASCADE,
        related_name='mentors'
    )

    # Localisation
    department = models.ForeignKey(
        'Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mentors',
        verbose_name='Département'
    )
    city        = models.CharField(max_length=100, blank=True, verbose_name='Ville')
    code_postal = models.CharField(max_length=10,  blank=True, verbose_name='Code postal')

    # Infos personnelles
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)

    # Capacité
    max_capacity = models.IntegerField(default=1, help_text="Nombre max de jeunes simultanés")
    disponibilite_reelle = models.IntegerField(default=1, help_text="Places disponibles actuellement")

    # Observations libres (visibles ACP uniquement)
    observations = models.TextField(blank=True, default='', verbose_name='Observations')

    # Statut
    is_active = models.BooleanField(default=True)
    is_trained = models.BooleanField(default=False, help_text="Formation validée")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mentors'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.pole.code})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        if self.disponibilite_reelle > self.max_capacity:
            self.disponibilite_reelle = self.max_capacity
        if self.disponibilite_reelle < 0:
            self.disponibilite_reelle = 0
        super().save(*args, **kwargs)
