from django.db import models


class CNMember(models.Model):
    """
    Conseiller National - Acces total
    """
    FONCTION_CHOICES = [
        ('membre',       'Membre CN'),
        ('resp_anim',    'Responsable Animation du Comite'),
        ('resp_reseau',  'Responsable Animation du Reseau des Poles'),
        ('resp_doc',     'Responsable Doc Internes - Formation'),
        ('resp_finance', 'Responsable Finance/Financements/Achats'),
        ('resp_com',     'Responsable Com (yc TSB) - Partenariats'),
        ('resp_si',      "Responsable des Systemes d'Information (SI)"),
    ]

    user = models.OneToOneField(
        'User',
        on_delete=models.CASCADE,
        related_name='cn_member'
    )

    # Infos
    first_name = models.CharField(max_length=100)
    last_name  = models.CharField(max_length=100)
    email      = models.EmailField()
    phone      = models.CharField(max_length=30, blank=True)
    ville      = models.CharField(max_length=100, blank=True)

    # Role & affiliation
    fonction = models.CharField(
        max_length=20, choices=FONCTION_CHOICES, default='membre', blank=True
    )
    association = models.ForeignKey(
        'Association',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='cn_members',
        help_text="Association nationale d'appartenance",
    )
    pole = models.ForeignKey(
        'Pole',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='cn_members',
        help_text="Pole de rattachement (si ACP / AP)",
    )

    is_active        = models.BooleanField(default=True)
    is_super_admin   = models.BooleanField(default=False, help_text="Acces admin Django")
    cn_acces_complet = models.BooleanField(
        default=False,
        help_text="Acces complet CN : gestion mentors, poles, animateurs, configuration"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cn_members'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"CN - {self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
