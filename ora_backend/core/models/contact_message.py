# core/models/contact_message.py
from django.db import models


class ContactMessage(models.Model):
    SUJET_CHOICES = [
        ('apprentice',  'Je suis apprenti(e)'),
        ('mentor',      'Je veux devenir mentor'),
        ('partner',     'Partenariat'),
        ('press',       'Presse / Média'),
        ('other',       'Autre'),
    ]

    name       = models.CharField(max_length=200, verbose_name='Nom')
    email      = models.EmailField(verbose_name='Email')
    phone      = models.CharField(max_length=30, blank=True, verbose_name='Téléphone')
    subject    = models.CharField(max_length=50, choices=SUJET_CHOICES, verbose_name='Sujet')
    message    = models.TextField(verbose_name='Message')
    is_read    = models.BooleanField(default=False, verbose_name='Lu')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'contact_messages'
        ordering = ['-created_at']
        verbose_name = 'Message de contact'
        verbose_name_plural = 'Messages de contact'

    def __str__(self):
        return f"{self.name} — {self.get_subject_display()} ({self.created_at.date()})"
